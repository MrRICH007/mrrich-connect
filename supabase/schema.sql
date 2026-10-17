-- MR RICH CONNECT — Supabase schema starter
-- Run in Supabase SQL Editor. Test policies with separate user accounts before public launch.
create extension if not exists pgcrypto;

create type public.premium_status as enum ('none','pending','active','expired','cancelled');
create type public.request_status as enum ('pending','accepted','declined','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 2 and 24 and nickname !~ '[[:space:]@]'),
  level text,
  college text,
  school text,
  avatar_url text,
  bio text check (char_length(coalesce(bio,'')) <= 300),
  premium_status public.premium_status not null default 'none',
  premium_title text,
  total_online_seconds bigint not null default 0 check (total_online_seconds >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Do NOT add name, phone, department, or email to profiles. They remain in auth/private server-side systems.

create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table public.message_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status public.request_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> recipient_id),
  unique(sender_id, recipient_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('private','group')),
  title text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key(conversation_id,user_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index messages_conversation_created_idx on public.messages(conversation_id,created_at desc);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  description text check (char_length(coalesce(description,'')) <= 500),
  created_by uuid not null references public.profiles(id) on delete restrict,
  is_private boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  primary key(group_id,user_id)
);

create table public.online_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0)
);
create index online_sessions_user_idx on public.online_sessions(user_id,started_at desc);

create table public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  media_type text not null check (media_type in ('image','video')),
  media_path text not null,
  target_url text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  is_enabled boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (expires_at > starts_at)
);

create table public.premium_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null check (source in ('admin','payment')),
  provider_reference text unique,
  status text not null check (status in ('pending','active','expired','cancelled','failed')),
  starts_at timestamptz,
  expires_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Admins are assigned only by a trusted project owner in SQL, never by a public form.
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','super_admin')),
  created_at timestamptz not null default now()
);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;
create or replace function public.is_conversation_member(cid uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.conversation_members where conversation_id=cid and user_id=auth.uid());
$$;
create or replace function public.is_group_member(gid uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.group_members where group_id=gid and user_id=auth.uid());
$$;

alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.message_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.online_sessions enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.premium_entitlements enable row level security;
alter table public.admin_users enable row level security;

-- Public profile projection contains ONLY approved public fields; private signup metadata is not in this table.
create policy "signed in users can view public profiles" on public.profiles for select to authenticated using (true);
create policy "users create own profile" on public.profiles for insert to authenticated with check (id=auth.uid());
create policy "users update own profile" on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
create policy "admin can update profiles" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "view follows" on public.follows for select to authenticated using (true);
create policy "follow as self" on public.follows for insert to authenticated with check (follower_id=auth.uid());
create policy "unfollow as self" on public.follows for delete to authenticated using (follower_id=auth.uid());

create policy "request participants can view" on public.message_requests for select to authenticated using (sender_id=auth.uid() or recipient_id=auth.uid());
create policy "sender creates request" on public.message_requests for insert to authenticated with check (sender_id=auth.uid() and status='pending');
create policy "recipient responds to request" on public.message_requests for update to authenticated using (recipient_id=auth.uid() and status='pending') with check (recipient_id=auth.uid() and status in ('accepted','declined'));

create policy "members view conversations" on public.conversations for select to authenticated using (public.is_conversation_member(id) or public.is_admin());
create policy "authenticated users create conversations" on public.conversations for insert to authenticated with check (created_by=auth.uid());
create policy "members view member lists" on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id) or public.is_admin());
create policy "user can join self to conversation" on public.conversation_members for insert to authenticated with check (user_id=auth.uid() or public.is_admin());
create policy "member messages visible" on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
create policy "members send messages" on public.messages for insert to authenticated with check (sender_id=auth.uid() and public.is_conversation_member(conversation_id));
create policy "sender edits own messages" on public.messages for update to authenticated using (sender_id=auth.uid() and public.is_conversation_member(conversation_id)) with check (sender_id=auth.uid());

create policy "public groups visible" on public.groups for select to authenticated using (not is_private or public.is_group_member(id) or public.is_admin());
create policy "users create groups" on public.groups for insert to authenticated with check (created_by=auth.uid());
create policy "group members visible to members" on public.group_members for select to authenticated using (public.is_group_member(group_id) or public.is_admin());
create policy "users can join public groups" on public.group_members for insert to authenticated with check (user_id=auth.uid() and exists(select 1 from public.groups g where g.id=group_id and not g.is_private));
create policy "group owner or admin manages members" on public.group_members for delete to authenticated using (user_id=auth.uid() or exists(select 1 from public.group_members gm where gm.group_id=group_id and gm.user_id=auth.uid() and gm.role in ('owner','admin')) or public.is_admin());

create policy "users view own online sessions" on public.online_sessions for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "users create own online sessions" on public.online_sessions for insert to authenticated with check (user_id=auth.uid());
create policy "users update own online sessions" on public.online_sessions for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

create policy "active ads visible to signed in users" on public.ad_campaigns for select to authenticated using (is_enabled and starts_at<=now() and expires_at>now());
create policy "admins manage ads" on public.ad_campaigns for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "users view own entitlements" on public.premium_entitlements for select to authenticated using (user_id=auth.uid() or public.is_admin());
create policy "admins manage entitlements" on public.premium_entitlements for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins view admin list" on public.admin_users for select to authenticated using (public.is_admin());

-- Public landing page ad feed (expiry enforced by policy above). Admin uploads should use private storage + signed URLs,
-- or a public ads bucket only if the uploaded material is intentionally public. Never expose service-role keys in the browser.

-- Create your first admin after creating the account in Supabase Auth:
-- insert into public.admin_users(user_id, role) values ('YOUR_AUTH_USER_UUID','super_admin');
