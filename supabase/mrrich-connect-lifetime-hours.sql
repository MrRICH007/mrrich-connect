-- MR RICH CONNECT: accumulate lifetime online time from authenticated heartbeats.
-- Run once in Supabase Dashboard -> SQL Editor.
-- The frontend calls heartbeat_user_presence() approximately every 30 seconds.
-- Gaps over 90 seconds are not counted, preventing long background/closed-tab gaps
-- from being treated as online time.

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;

drop policy if exists "Authenticated users can view presence timestamps" on public.user_presence;
create policy "Authenticated users can view presence timestamps"
  on public.user_presence
  for select
  to authenticated
  using (true);

create or replace function public.heartbeat_user_presence()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_previous_seen timestamptz;
  v_now timestamptz := clock_timestamp();
  v_elapsed_seconds integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  -- Lock this account's presence row so simultaneous tabs do not normally
  -- count the same heartbeat interval more than once.
  select last_seen_at
    into v_previous_seen
    from public.user_presence
    where user_id = v_user_id
    for update;

  if not found then
    insert into public.user_presence (user_id, last_seen_at)
    values (v_user_id, v_now)
    on conflict (user_id) do nothing;
  else
    v_elapsed_seconds := floor(extract(epoch from (v_now - v_previous_seen)))::integer;

    update public.user_presence
      set last_seen_at = v_now
      where user_id = v_user_id;

    -- Count only short, regular heartbeat intervals; do not count long gaps.
    if v_elapsed_seconds > 0 and v_elapsed_seconds <= 90 then
      update public.profiles
        set total_online_seconds = coalesce(total_online_seconds, 0) + v_elapsed_seconds
        where id = v_user_id;
    end if;
  end if;
end;
$$;

revoke all on function public.heartbeat_user_presence() from public;
grant execute on function public.heartbeat_user_presence() to authenticated;

revoke all on table public.user_presence from anon, authenticated;
grant select on table public.user_presence to authenticated;

create index if not exists user_presence_last_seen_at_idx
  on public.user_presence (last_seen_at desc);
