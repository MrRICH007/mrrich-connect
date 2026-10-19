-- Persistent unread tracking and push subscriptions for MR RICH CONNECT.
-- Safe to run more than once.
create table if not exists public.conversation_read_state (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default 'epoch'::timestamptz,
  updated_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.conversation_read_state enable row level security;
drop policy if exists "Users can read their own conversation read state" on public.conversation_read_state;
create policy "Users can read their own conversation read state" on public.conversation_read_state
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users can update their own conversation read state" on public.conversation_read_state;
create policy "Users can update their own conversation read state" on public.conversation_read_state
  for all to authenticated using (user_id = auth.uid() and exists (
    select 1 from public.conversation_members cm where cm.conversation_id=conversation_read_state.conversation_id and cm.user_id=auth.uid()
  )) with check (user_id = auth.uid() and exists (
    select 1 from public.conversation_members cm where cm.conversation_id=conversation_read_state.conversation_id and cm.user_id=auth.uid()
  ));

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if not exists (select 1 from public.conversation_members cm where cm.conversation_id=p_conversation_id and cm.user_id=auth.uid()) then raise exception 'You are not a member of this conversation'; end if;
  insert into public.conversation_read_state(conversation_id,user_id,last_read_at,updated_at)
  values(p_conversation_id,auth.uid(),now(),now())
  on conflict(conversation_id,user_id) do update set last_read_at=excluded.last_read_at, updated_at=now();
end; $$;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

create or replace function public.get_unread_message_counts()
returns table(conversation_id uuid, unread_count bigint) language sql security definer set search_path=public as $$
  select cm.conversation_id, count(m.id) as unread_count
  from public.conversation_members cm
  left join public.conversation_read_state rs on rs.conversation_id=cm.conversation_id and rs.user_id=auth.uid()
  left join public.messages m on m.conversation_id=cm.conversation_id and m.sender_id<>auth.uid()
    and m.created_at>coalesce(rs.last_read_at,'epoch'::timestamptz)
    and (to_jsonb(m)->>'deleted_at' is null)
  where cm.user_id=auth.uid()
  group by cm.conversation_id having count(m.id)>0;
$$;
grant execute on function public.get_unread_message_counts() to authenticated;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;
-- Intentionally no client policies: only the authenticated API route using the service role can manage subscriptions.
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
