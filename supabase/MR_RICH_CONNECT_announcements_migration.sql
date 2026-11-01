-- MR RICH CONNECT: Premium-only community announcements
-- Run once in Supabase SQL Editor.

create table if not exists public.community_announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  caption text not null check (char_length(trim(caption)) between 1 and 500),
  image_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists community_announcements_created_at_idx
  on public.community_announcements (created_at desc);

alter table public.community_announcements enable row level security;

grant select, insert, delete on table public.community_announcements to authenticated;

drop policy if exists "Announcements are visible to everyone" on public.community_announcements;
create policy "Announcements are visible to everyone"
  on public.community_announcements for select
  to authenticated
  using (true);

drop policy if exists "Premium members can publish announcements" on public.community_announcements;
create policy "Premium members can publish announcements"
  on public.community_announcements for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.premium_status = 'active'
    )
  );

drop policy if exists "Authors can delete their own announcements" on public.community_announcements;
create policy "Authors can delete their own announcements"
  on public.community_announcements for delete
  to authenticated
  using (author_id = auth.uid());

-- Public image bucket. Only premium members can upload into their own user folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('announcements', 'announcements', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "Premium members upload announcement images" on storage.objects;
create policy "Premium members upload announcement images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'announcements'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.premium_status = 'active'
    )
  );

drop policy if exists "Announcement images are publicly readable" on storage.objects;
create policy "Announcement images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'announcements');

drop policy if exists "Premium members update own announcement images" on storage.objects;
create policy "Premium members update own announcement images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'announcements' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (
    bucket_id = 'announcements'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.premium_status = 'active')
  );

drop policy if exists "Premium members delete own announcement images" on storage.objects;
create policy "Premium members delete own announcement images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'announcements' and (storage.foldername(name))[1] = auth.uid()::text);
