-- MR RICH CONNECT: Premium chat entrance animation preference.
-- Run this after the base profiles migration and before deploying the updated page.tsx.

alter table public.profiles
  add column if not exists disable_chat_animation boolean not null default false;

-- Existing accounts retain the default (animation enabled for Premium members).
-- The preference is only editable by the profile owner through the existing profiles RLS policy.
