-- Allow signed-out visitors to OPEN shared contests, but never to vote.
-- Run in Supabase SQL Editor after the contest expiry migration.

grant select on public.rc_contests to anon;
grant select on public.rc_contest_options to anon;

drop policy if exists "Anonymous visitors read active published contests" on public.rc_contests;
create policy "Anonymous visitors read active published contests"
  on public.rc_contests
  for select
  to anon
  using (is_published = true and expires_at > now());

drop policy if exists "Anonymous visitors read options of active contests" on public.rc_contest_options;
create policy "Anonymous visitors read options of active contests"
  on public.rc_contest_options
  for select
  to anon
  using (exists (
    select 1
    from public.rc_contests c
    where c.id = contest_id
      and c.is_published = true
      and c.expires_at > now()
  ));

-- No anonymous vote permissions are granted. The vote RPC remains
-- authenticated-only and independently checks auth.uid().
revoke insert, update, delete on public.rc_contests from anon;
revoke insert, update, delete on public.rc_contest_options from anon;
revoke all on public.rc_contest_votes from anon;
