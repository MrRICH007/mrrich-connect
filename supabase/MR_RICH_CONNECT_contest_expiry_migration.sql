-- MR RICH CONNECT contest expiry support.
-- Run in Supabase SQL Editor before deploying the updated page.tsx.

alter table public.rc_contests
  add column if not exists expires_at timestamptz;

-- Existing contests get a seven-day lifetime from their original creation time.
update public.rc_contests
set expires_at = created_at + interval '7 days'
where expires_at is null;

alter table public.rc_contests
  alter column expires_at set default (now() + interval '7 days'),
  alter column expires_at set not null;

create index if not exists rc_contests_active_expiry_idx
  on public.rc_contests(is_published, expires_at desc);

-- Enforce the seven-day maximum at the database boundary as well as in the UI.
create or replace function public.rc_validate_contest_expiry()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.expires_at is null then
    new.expires_at := coalesce(new.created_at, now()) + interval '7 days';
  end if;
  if new.expires_at <= coalesce(new.created_at, now()) then
    raise exception 'Contest expiry must be after its start time.';
  end if;
  if new.expires_at > coalesce(new.created_at, now()) + interval '7 days' then
    raise exception 'A contest cannot run for more than 7 days.';
  end if;
  return new;
end;
$$;

drop trigger if exists rc_contest_expiry_guard on public.rc_contests;
create trigger rc_contest_expiry_guard
before insert or update of expires_at, created_at on public.rc_contests
for each row execute function public.rc_validate_contest_expiry();

-- Voting is blocked once the selected expiry time has passed.
create or replace function public.rc_vote_contest(p_contest_id uuid, p_option_id uuid)
returns table(id uuid, votes bigint, percentage numeric)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_expires_at timestamptz;
  v_is_published boolean;
begin
  if v_user_id is null then raise exception 'You must be signed in to vote.'; end if;
  select is_published, expires_at into v_is_published, v_expires_at
  from public.rc_contests where rc_contests.id = p_contest_id;
  if coalesce(v_is_published, false) = false then raise exception 'This contest is not available.'; end if;
  if v_expires_at is null or v_expires_at <= now() then raise exception 'This contest has expired.'; end if;
  if not exists (select 1 from public.rc_contest_options o where o.id = p_option_id and o.contest_id = p_contest_id) then
    raise exception 'That answer does not belong to this contest.';
  end if;
  insert into public.rc_contest_votes(contest_id, option_id, user_id)
  values (p_contest_id, p_option_id, v_user_id);
  return query
    with counts as (
      select o.id, count(v.id)::bigint as vote_count
      from public.rc_contest_options o
      left join public.rc_contest_votes v on v.option_id = o.id and v.contest_id = o.contest_id
      where o.contest_id = p_contest_id group by o.id
    ), total as (select coalesce(sum(vote_count),0)::numeric as n from counts)
    select counts.id, counts.vote_count,
      case when total.n = 0 then 0::numeric else round((counts.vote_count::numeric / total.n) * 100, 1) end
    from counts cross join total order by counts.id;
exception when unique_violation then
  raise exception 'You have already voted in this contest.';
end;
$$;
revoke all on function public.rc_vote_contest(uuid, uuid) from public, anon;
grant execute on function public.rc_vote_contest(uuid, uuid) to authenticated;
