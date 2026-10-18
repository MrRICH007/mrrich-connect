-- MR RICH CONNECT: separate public profile details from private account details.
-- Run once in Supabase SQL Editor.

alter table public.profiles add column if not exists department text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;

create table if not exists public.private_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.private_profiles enable row level security;
drop policy if exists "Users can read their own private profile" on public.private_profiles;
create policy "Users can read their own private profile"
  on public.private_profiles for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "Users can insert their own private profile" on public.private_profiles;
create policy "Users can insert their own private profile"
  on public.private_profiles for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "Users can update their own private profile" on public.private_profiles;
create policy "Users can update their own private profile"
  on public.private_profiles for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.create_profile_records_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, level, college, school, department, bio)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nickname'), ''), 'member_' || left(new.id::text, 8)),
    nullif(trim(new.raw_user_meta_data->>'level'), ''),
    nullif(trim(new.raw_user_meta_data->>'college'), ''),
    nullif(trim(new.raw_user_meta_data->>'school'), ''),
    nullif(trim(new.raw_user_meta_data->>'department'), ''),
    nullif(trim(new.raw_user_meta_data->>'bio'), '')
  )
  on conflict (id) do update set
    level = excluded.level,
    college = excluded.college,
    school = excluded.school,
    department = excluded.department,
    bio = excluded.bio;

  insert into public.private_profiles (user_id, full_name, phone)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'phone'), '')
  )
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile_records on auth.users;
create trigger on_auth_user_created_profile_records
after insert on auth.users
for each row execute procedure public.create_profile_records_for_new_user();

-- The profile table is intended for public-facing fields only. Never add full_name or phone here.
