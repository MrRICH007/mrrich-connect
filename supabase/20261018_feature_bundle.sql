-- MR RICH CONNECT coordinated feature bundle
-- Run once in Supabase SQL Editor after reviewing.
create extension if not exists pgcrypto;

-- Allow another request after a decline, while preventing duplicate pending requests.
alter table public.message_requests drop constraint if exists message_requests_sender_id_recipient_id_key;
create unique index if not exists message_requests_one_pending_pair
  on public.message_requests(sender_id, recipient_id) where status = 'pending';

-- Link each group to a real chat conversation.
alter table public.groups add column if not exists conversation_id uuid references public.conversations(id) on delete set null;
create unique index if not exists groups_conversation_id_unique
  on public.groups(conversation_id) where conversation_id is not null;
create index if not exists ad_campaigns_active_window_idx
  on public.ad_campaigns(is_enabled, starts_at, expires_at);

-- Refresh policies used by group discovery and membership.
drop policy if exists "group members visible to members" on public.group_members;
create policy "group members visible to members" on public.group_members
  for select to authenticated
  using (public.is_group_member(group_id)
    or exists (select 1 from public.groups g where g.id = group_id and not g.is_private)
    or public.is_admin());

-- Atomic accept/decline handlers: only the intended recipient can respond.
create or replace function public.accept_message_request(p_request_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare req public.message_requests%rowtype; convo_id uuid;
begin
  select * into req from public.message_requests
   where id=p_request_id and recipient_id=auth.uid() and status='pending' for update;
  if not found then raise exception 'Pending request not found or not yours'; end if;
  select c.id into convo_id from public.conversations c
    join public.conversation_members a on a.conversation_id=c.id and a.user_id=req.sender_id
    join public.conversation_members b on b.conversation_id=c.id and b.user_id=req.recipient_id
    where c.kind='private' limit 1;
  if convo_id is null then
    insert into public.conversations(kind,title,created_by) values('private',null,req.recipient_id) returning id into convo_id;
    insert into public.conversation_members(conversation_id,user_id,role)
      values(convo_id,req.sender_id,'member'),(convo_id,req.recipient_id,'member') on conflict do nothing;
  end if;
  update public.message_requests set status='accepted',responded_at=now() where id=p_request_id;
  return convo_id;
end; $$;
grant execute on function public.accept_message_request(uuid) to authenticated;

create or replace function public.decline_message_request(p_request_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
begin
  update public.message_requests set status='declined',responded_at=now()
   where id=p_request_id and recipient_id=auth.uid() and status='pending';
  return found;
end; $$;
grant execute on function public.decline_message_request(uuid) to authenticated;

-- Create a group, its conversation, and owner membership as one transaction.
create or replace function public.create_group_with_conversation(p_name text, p_description text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare gid uuid; cid uuid;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if length(trim(coalesce(p_name,'')))<2 or length(trim(p_name))>60 then raise exception 'Group name must be 2–60 characters'; end if;
  insert into public.groups(name,description,created_by) values(trim(p_name),nullif(trim(coalesce(p_description,'')),''),auth.uid()) returning id into gid;
  insert into public.conversations(kind,title,created_by) values('group',trim(p_name),auth.uid()) returning id into cid;
  update public.groups set conversation_id=cid where id=gid;
  insert into public.group_members(group_id,user_id,role) values(gid,auth.uid(),'owner');
  insert into public.conversation_members(conversation_id,user_id,role) values(cid,auth.uid(),'owner');
  return gid;
end; $$;
grant execute on function public.create_group_with_conversation(text,text) to authenticated;

create or replace function public.join_group_with_conversation(p_group_id uuid)
returns uuid language plpgsql security definer set search_path=public as $$
declare g public.groups%rowtype;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  select * into g from public.groups where id=p_group_id and not is_private;
  if not found then raise exception 'Public group not found'; end if;
  if g.conversation_id is null then raise exception 'This group has no chat conversation yet'; end if;
  insert into public.group_members(group_id,user_id,role) values(g.id,auth.uid(),'member') on conflict do nothing;
  insert into public.conversation_members(conversation_id,user_id,role) values(g.conversation_id,auth.uid(),'member') on conflict do nothing;
  return g.conversation_id;
end; $$;
grant execute on function public.join_group_with_conversation(uuid) to authenticated;

-- Keep premium grants/admin ads admin-controlled through existing RLS policies.
-- Never put a service-role key in page.tsx. Ad media should be stored in Supabase Storage;
-- store the object path in ad_campaigns.media_path and generate safe public/signed URLs.
