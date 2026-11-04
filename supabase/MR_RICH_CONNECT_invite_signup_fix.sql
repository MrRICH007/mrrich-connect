-- MR RICH CONNECT: make invited account creation reliable.
-- Run in Supabase SQL Editor. This replaces the old auth.users trigger.
-- The trigger MUST NEVER prevent Supabase Auth from creating an account.

create or replace function public.rc_process_invite_signup(
  p_invitee_id uuid,
  p_invite_token text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_token uuid;
  v_inviter_id uuid;
  v_connection_id bigint;
  v_conversation_id uuid;
begin
  if p_invitee_id is null or coalesce(trim(p_invite_token), '') = '' then
    return false;
  end if;

  begin
    v_token := trim(p_invite_token)::uuid;
  exception when others then
    raise warning 'MR RICH CONNECT invite: invalid invite token for invitee %', p_invitee_id;
    return false;
  end;

  select user_id into v_inviter_id
  from public.rc_invite_links
  where token = v_token;

  if v_inviter_id is null or v_inviter_id = p_invitee_id then
    return false;
  end if;

  -- Keep referral attribution even if creating the chat needs to be retried.
  insert into public.rc_invite_connections (inviter_id, invitee_id)
  values (v_inviter_id, p_invitee_id)
  on conflict (invitee_id) do nothing;

  select id, conversation_id
    into v_connection_id, v_conversation_id
  from public.rc_invite_connections
  where invitee_id = p_invitee_id;

  if v_connection_id is null then
    return false;
  end if;

  if v_conversation_id is not null then
    return true;
  end if;

  -- This block is a subtransaction. If chat creation fails, the referral row
  -- remains saved and the user's Auth account is still created successfully.
  begin
    insert into public.conversations (title, kind)
    values ('Private chat', 'person')
    returning id into v_conversation_id;

    insert into public.conversation_members (conversation_id, user_id)
    values (v_conversation_id, v_inviter_id),
           (v_conversation_id, p_invitee_id);

    update public.rc_invite_connections
    set conversation_id = v_conversation_id
    where id = v_connection_id;

    return true;
  exception when others then
    raise warning 'MR RICH CONNECT invite chat creation failed for invitee %: %', p_invitee_id, sqlerrm;
    return false;
  end;
exception when others then
  -- Referral automation must never abort account creation.
  raise warning 'MR RICH CONNECT invite processing failed for invitee %: %', p_invitee_id, sqlerrm;
  return false;
end;
$$;

revoke all on function public.rc_process_invite_signup(uuid, text) from public, anon, authenticated;

create or replace function public.rc_create_invite_conversation()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  begin
    perform public.rc_process_invite_signup(
      new.id,
      coalesce(new.raw_user_meta_data ->> 'rc_invite_token', '')
    );
  exception when others then
    -- Never let invite automation block sign-up.
    raise warning 'MR RICH CONNECT invite trigger ignored an error for user %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

revoke all on function public.rc_create_invite_conversation() from public, anon, authenticated;

drop trigger if exists rc_auth_user_invite_conversation on auth.users;
create trigger rc_auth_user_invite_conversation
after insert on auth.users
for each row execute function public.rc_create_invite_conversation();

-- Recovery path: after the invitee confirms email and signs in, the app calls
-- this RPC. It reads the token from that user's Auth metadata and retries any
-- referral/chat work that the signup trigger could not complete.
create or replace function public.rc_complete_my_invite_connection()
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_token text;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to complete an invite.';
  end if;

  select raw_user_meta_data ->> 'rc_invite_token'
    into v_token
  from auth.users
  where id = auth.uid();

  return public.rc_process_invite_signup(auth.uid(), coalesce(v_token, ''));
end;
$$;

revoke all on function public.rc_complete_my_invite_connection() from public, anon;
grant execute on function public.rc_complete_my_invite_connection() to authenticated;
