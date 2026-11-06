-- MR RICH CONNECT: community contests with optional cover/answer images and one vote per member.
-- Run once in Supabase SQL Editor as project owner before deploying the matching page.tsx.

create table if not exists public.rc_contests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  question text not null check (char_length(btrim(question)) between 1 and 500),
  cover_image_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists rc_contests_published_created_idx
  on public.rc_contests(is_published, created_at desc);
create index if not exists rc_contests_author_created_idx
  on public.rc_contests(author_id, created_at desc);

create table if not exists public.rc_contest_options (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.rc_contests(id) on delete cascade,
  caption text not null check (char_length(btrim(caption)) between 1 and 240),
  image_path text,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint rc_contest_options_id_contest_unique unique(id, contest_id)
);
create index if not exists rc_contest_options_contest_position_idx
  on public.rc_contest_options(contest_id, position, created_at);

create table if not exists public.rc_contest_votes (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.rc_contests(id) on delete cascade,
  option_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint rc_contest_votes_one_per_user unique(contest_id, user_id),
  constraint rc_contest_votes_option_matches_contest
    foreign key(option_id, contest_id)
    references public.rc_contest_options(id, contest_id) on delete cascade
);
create index if not exists rc_contest_votes_contest_option_idx
  on public.rc_contest_votes(contest_id, option_id);

alter table public.rc_contests enable row level security;
alter table public.rc_contest_options enable row level security;
alter table public.rc_contest_votes enable row level security;

grant select, insert, update, delete on public.rc_contests to authenticated;
grant select, insert, update, delete on public.rc_contest_options to authenticated;
grant select on public.rc_contest_votes to authenticated;

drop policy if exists "Published contests and own drafts are readable" on public.rc_contests;
create policy "Published contests and own drafts are readable"
  on public.rc_contests for select to authenticated
  using (is_published = true or author_id = auth.uid());
drop policy if exists "Members create own contests" on public.rc_contests;
create policy "Members create own contests"
  on public.rc_contests for insert to authenticated
  with check (author_id = auth.uid());
drop policy if exists "Authors update own contests" on public.rc_contests;
create policy "Authors update own contests"
  on public.rc_contests for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists "Authors delete own contests" on public.rc_contests;
create policy "Authors delete own contests"
  on public.rc_contests for delete to authenticated
  using (author_id = auth.uid());

drop policy if exists "Options of visible contests are readable" on public.rc_contest_options;
create policy "Options of visible contests are readable"
  on public.rc_contest_options for select to authenticated
  using (exists (
    select 1 from public.rc_contests c
    where c.id = contest_id and (c.is_published = true or c.author_id = auth.uid())
  ));
drop policy if exists "Authors add contest options" on public.rc_contest_options;
create policy "Authors add contest options"
  on public.rc_contest_options for insert to authenticated
  with check (exists (
    select 1 from public.rc_contests c
    where c.id = contest_id and c.author_id = auth.uid()
  ));
drop policy if exists "Authors update contest options" on public.rc_contest_options;
create policy "Authors update contest options"
  on public.rc_contest_options for update to authenticated
  using (exists (select 1 from public.rc_contests c where c.id = contest_id and c.author_id = auth.uid()))
  with check (exists (select 1 from public.rc_contests c where c.id = contest_id and c.author_id = auth.uid()));
drop policy if exists "Authors delete contest options" on public.rc_contest_options;
create policy "Authors delete contest options"
  on public.rc_contest_options for delete to authenticated
  using (exists (select 1 from public.rc_contests c where c.id = contest_id and c.author_id = auth.uid()));

-- Members can inspect only their own vote. Voting itself is performed by the atomic RPC below.
drop policy if exists "Members read own contest votes" on public.rc_contest_votes;
create policy "Members read own contest votes"
  on public.rc_contest_votes for select to authenticated
  using (user_id = auth.uid());
revoke insert, update, delete on public.rc_contest_votes from anon, authenticated;

-- Public image delivery is needed for previews in the contest feed.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('contest-images', 'contest-images', true, 10485760,
        array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Contest images are publicly readable" on storage.objects;
create policy "Contest images are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'contest-images');
drop policy if exists "Members upload contest images to own folder" on storage.objects;
create policy "Members upload contest images to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'contest-images' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Members delete own contest images" on storage.objects;
create policy "Members delete own contest images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'contest-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- One atomic vote per member per contest. The unique constraint prevents duplicate voting.
create or replace function public.rc_vote_contest(p_contest_id uuid, p_option_id uuid)
returns table(id uuid, votes bigint, percentage numeric)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_published boolean;
begin
  if v_user_id is null then raise exception 'You must be signed in to vote.'; end if;
  select is_published into v_is_published from public.rc_contests where rc_contests.id = p_contest_id;
  if coalesce(v_is_published, false) = false then raise exception 'This contest is not available.'; end if;
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
      where o.contest_id = p_contest_id
      group by o.id
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

-- Return live aggregate totals; raw votes remain private.
create or replace function public.rc_get_contest_results(p_contest_id uuid)
returns table(id uuid, votes bigint, percentage numeric)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  with counts as (
    select o.id, count(v.id)::bigint as vote_count
    from public.rc_contest_options o
    left join public.rc_contest_votes v on v.option_id = o.id and v.contest_id = o.contest_id
    where o.contest_id = p_contest_id
      and exists (select 1 from public.rc_contests c where c.id = p_contest_id and c.is_published = true)
    group by o.id
  ), total as (select coalesce(sum(vote_count),0)::numeric as n from counts)
  select counts.id, counts.vote_count,
    case when total.n = 0 then 0::numeric else round((counts.vote_count::numeric / total.n) * 100, 1) end
  from counts cross join total order by counts.id;
$$;
revoke all on function public.rc_get_contest_results(uuid) from public, anon;
grant execute on function public.rc_get_contest_results(uuid) to authenticated;
