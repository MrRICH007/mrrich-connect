-- MR RICH CONNECT: statuses, nickname uniqueness, referral counts and expiry metadata.
-- Run in Supabase SQL Editor while signed in as the project owner.

create table if not exists public.user_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  caption text not null check (char_length(caption) <= 500),
  link_url text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours')
);
create index if not exists user_statuses_user_expires_idx on public.user_statuses(user_id, expires_at desc);

create table if not exists public.status_views (
  status_id uuid not null references public.user_statuses(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key(status_id, viewer_id)
);

alter table public.user_statuses enable row level security;
alter table public.status_views enable row level security;
drop policy if exists "Active statuses are readable" on public.user_statuses;
create policy "Active statuses are readable" on public.user_statuses for select to authenticated using (expires_at > now());
drop policy if exists "Users create own statuses" on public.user_statuses;
create policy "Users create own statuses" on public.user_statuses for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Users delete own statuses" on public.user_statuses;
create policy "Users delete own statuses" on public.user_statuses for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "Viewers read own status views" on public.status_views;
create policy "Viewers read own status views" on public.status_views for select to authenticated using (auth.uid() = viewer_id);
drop policy if exists "Viewers record own status views" on public.status_views;
create policy "Viewers record own status views" on public.status_views for insert to authenticated with check (auth.uid() = viewer_id);
drop policy if exists "Viewers update own status views" on public.status_views;
create policy "Viewers update own status views" on public.status_views for update to authenticated using (auth.uid() = viewer_id) with check (auth.uid() = viewer_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('status-images','status-images',true,10485760,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;
drop policy if exists "Authenticated users upload own status images" on storage.objects;
create policy "Authenticated users upload own status images" on storage.objects for insert to authenticated with check (bucket_id='status-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Public read status images" on storage.objects;
create policy "Public read status images" on storage.objects for select to public using (bucket_id='status-images');
drop policy if exists "Users delete own status images" on storage.objects;
create policy "Users delete own status images" on storage.objects for delete to authenticated using (bucket_id='status-images' and (storage.foldername(name))[1]=auth.uid()::text);

-- Exact nickname uniqueness is case-sensitive, matching the requested exact-match rule.
-- If this index fails, resolve existing duplicate nicknames before rerunning this statement.
create unique index if not exists profiles_nickname_exact_unique_idx on public.profiles(nickname);

create or replace function public.rc_nickname_available(requested_nickname text)
returns boolean language sql stable security definer set search_path=public
as $$
  select not exists (
    select 1 from public.profiles
    where nickname = btrim(regexp_replace(coalesce(requested_nickname,''), '^@', ''))
      and id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)
  );
$$;
grant execute on function public.rc_nickname_available(text) to anon, authenticated;

-- Referral totals are exposed through this signed-in RPC, not direct table access.
create or replace function public.rc_my_invite_count()
returns bigint language sql stable security definer set search_path=public
as $$ select count(*) from public.rc_invite_connections where inviter_id=auth.uid(); $$;
grant execute on function public.rc_my_invite_count() to authenticated;

-- Cleanup database rows only. Storage objects are removed by the companion server route
-- using the service-role key, since PostgreSQL cannot safely delete Storage files itself.
create or replace function public.rc_prune_expired_status_rows()
returns integer language plpgsql security definer set search_path=public
as $$
declare removed integer;
begin
  delete from public.user_statuses where expires_at <= now();
  get diagnostics removed = row_count;
  return removed;
end;
$$;
revoke all on function public.rc_prune_expired_status_rows() from public, anon, authenticated;

-- Enforce status eligibility in the database too; client-side checks are not security.
create or replace function public.rc_guard_status_eligibility()
returns trigger language plpgsql security definer set search_path=public
as $$
declare p public.profiles%rowtype; hours bigint;
begin
  select * into p from public.profiles where id = new.user_id;
  hours := floor(coalesce(p.total_online_seconds,0)::numeric / 3600)::bigint;
  if coalesce(p.premium_status,'') <> 'active' or hours < 10 then
    raise exception 'Status posting requires active Premium and Sharp Guy rank or higher';
  end if;
  new.created_at := now();
  new.expires_at := now() + interval '12 hours';
  return new;
end;
$$;
drop trigger if exists rc_guard_status_eligibility on public.user_statuses;
create trigger rc_guard_status_eligibility before insert on public.user_statuses
for each row execute function public.rc_guard_status_eligibility();
