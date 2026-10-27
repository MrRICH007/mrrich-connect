-- MR RICH CONNECT admin tools migration
-- Run in Supabase SQL Editor after taking a database backup.

alter table public.profiles add column if not exists is_blocked boolean not null default false;
alter table public.groups add column if not exists is_premium_only boolean not null default false;

-- Admin uploads are performed server-side with SUPABASE_SERVICE_ROLE_KEY.
-- Public read is needed because the app renders ad images for signed-in users.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ad-images', 'ad-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif'];

-- Ensure only admins can use the admin page/API: the existing public.is_admin()
-- RPC and admin_users records remain the source of admin authorization.
-- The API also verifies the signed-in user's JWT before using service role.

-- NOTE: Set ADMIN_PROTECTED_USER_ID in Render to the owner's Supabase Auth UUID.
-- This value is intentionally not guessed or hard-coded into this migration.
