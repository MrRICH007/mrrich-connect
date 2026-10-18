-- Run in the Supabase SQL Editor for MR RICH CONNECT.
-- Lets a signed-in user manage files in their own avatar folder and
-- in groups/<their-user-id>/..., while keeping uploads restricted.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Avatar owners can upload their files" on storage.objects;
create policy "Avatar owners can upload their files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or ((storage.foldername(name))[1] = 'groups' and (storage.foldername(name))[2] = auth.uid()::text)
  )
);

drop policy if exists "Avatar owners can update their files" on storage.objects;
create policy "Avatar owners can update their files"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or ((storage.foldername(name))[1] = 'groups' and (storage.foldername(name))[2] = auth.uid()::text)
  )
)
with check (
  bucket_id = 'avatars' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or ((storage.foldername(name))[1] = 'groups' and (storage.foldername(name))[2] = auth.uid()::text)
  )
);

drop policy if exists "Avatar owners can read their files" on storage.objects;
create policy "Avatar owners can read their files"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or ((storage.foldername(name))[1] = 'groups' and (storage.foldername(name))[2] = auth.uid()::text)
  )
);

-- Only the group creator or an admin can change a group's avatar URL.
drop policy if exists "Group creators and admins can update group avatars" on public.groups;
create policy "Group creators and admins can update group avatars"
on public.groups for update to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());
