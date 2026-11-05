-- MR RICH CONNECT: public inviter preview for shared invite links
-- Run once in the Supabase SQL Editor before deploying the updated page.tsx.
-- Returns only public profile display fields; no private profile data is exposed.

create or replace function public.rc_get_inviter_preview(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_token uuid;
  v_preview jsonb;
begin
  begin
    v_token := nullif(trim(coalesce(p_token, '')), '')::uuid;
  exception when invalid_text_representation then
    return null;
  end;

  if v_token is null then
    return null;
  end if;

  select jsonb_build_object(
    'inviter_id', links.user_id,
    'nickname', coalesce(nullif(profiles.nickname, ''), 'MR RICH CONNECT MEMBER'),
    'avatar_url', profiles.avatar_url,
    'invite_token', links.token::text
  )
  into v_preview
  from public.rc_invite_links as links
  left join public.profiles as profiles on profiles.id = links.user_id
  where links.token = v_token;

  return v_preview;
end;
$$;

revoke all on function public.rc_get_inviter_preview(text) from public;
grant execute on function public.rc_get_inviter_preview(text) to anon, authenticated;
