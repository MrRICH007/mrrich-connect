-- MR RICH CONNECT: stable online status using database-backed heartbeats.
-- Run this entire script once in Supabase Dashboard -> SQL Editor.

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;

-- Online count only needs account IDs and timestamps; no profile or private data is exposed.
drop policy if exists "Authenticated users can view presence timestamps" on public.user_presence;
create policy "Authenticated users can view presence timestamps"
  on public.user_presence
  for select
  to authenticated
  using (true);

-- The client cannot choose another account's ID or submit an arbitrary timestamp.
-- The function uses auth.uid() and the database clock.
create or replace function public.heartbeat_user_presence()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_presence (user_id, last_seen_at)
  values (v_user_id, now())
  on conflict (user_id)
  do update set last_seen_at = excluded.last_seen_at;
end;
$$;

revoke all on function public.heartbeat_user_presence() from public;
grant execute on function public.heartbeat_user_presence() to authenticated;

-- Clients can read presence rows but must update them through the function above.
revoke all on table public.user_presence from anon, authenticated;
grant select on table public.user_presence to authenticated;

create index if not exists user_presence_last_seen_at_idx
  on public.user_presence (last_seen_at desc);
