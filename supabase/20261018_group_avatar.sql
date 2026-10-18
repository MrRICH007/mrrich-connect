-- Run once in Supabase SQL Editor to enable group profile images.
alter table public.groups add column if not exists avatar_url text;
