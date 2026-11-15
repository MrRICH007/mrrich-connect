-- MR RICH CONNECT: group descriptions, co-admins, participant moderation,
-- and a Premium exception to group join closures.
-- Run in the Supabase SQL Editor before deploying the matching page.tsx.

alter table public.groups
  add column if not exists description text,
  add column if not exists join_closed boolean not null default false;

alter table public.group_members
  add column if not exists role text not null default 'member';

-- Ensure group creators are recognized as admins, including existing groups.
update public.group_members gm
set role = 'admin'
from public.groups g
where g.id = gm.group_id
  and g.created_by = gm.user_id
  and gm.role is distinct from 'admin';

create or replace function public.rc_guard_group_join_closed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
  v_join_closed boolean;
  v_premium boolean := false;
begin
  select g.created_by, coalesce(g.join_closed, false)
    into v_creator, v_join_closed
  from public.groups g
  where g.id = new.group_id;

  if not found then
    raise exception 'Group not found';
  end if;

  if new.user_id = v_creator then
    new.role := 'admin';
    return new;
  end if;

  if v_join_closed then
    select coalesce(p.premium_status = 'active', false)
      into v_premium
    from public.profiles p
    where p.id = new.user_id;

    if not coalesce(v_premium, false) then
      raise exception 'This group is closed to new members. Premium members can still join.';
    end if;
  end if;

  if new.role is null or btrim(new.role) = '' then
    new.role := 'member';
  end if;

  return new;
end;
$$;

drop trigger if exists rc_group_join_closed_guard on public.group_members;
create trigger rc_group_join_closed_guard
before insert on public.group_members
for each row execute function public.rc_guard_group_join_closed();

create or replace function public.rc_group_set_admin(
  p_group_id uuid,
  p_user_id uuid,
  p_make_admin boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
  v_is_manager boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  select created_by into v_creator
  from public.groups
  where id = p_group_id;

  if not found then
    raise exception 'Group not found';
  end if;

  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  ) into v_is_manager;

  if auth.uid() <> v_creator and not v_is_manager and not coalesce(public.is_admin(), false) then
    raise exception 'Only group admins can manage admins';
  end if;

  if p_user_id = v_creator and not p_make_admin then
    raise exception 'The group creator must remain an admin';
  end if;

  update public.group_members
  set role = case when p_make_admin then 'admin' else 'member' end
  where group_id = p_group_id
    and user_id = p_user_id;

  if not found then
    raise exception 'Participant is not a member of this group';
  end if;
end;
$$;

create or replace function public.rc_group_remove_member(
  p_group_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creator uuid;
  v_is_manager boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  select created_by into v_creator
  from public.groups
  where id = p_group_id;

  if not found then
    raise exception 'Group not found';
  end if;

  select exists (
    select 1 from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
      and gm.role = 'admin'
  ) into v_is_manager;

  if auth.uid() <> v_creator and not v_is_manager and not coalesce(public.is_admin(), false) then
    raise exception 'Only group admins can remove participants';
  end if;

  if p_user_id = v_creator then
    raise exception 'The group creator cannot be removed';
  end if;

  delete from public.group_members
  where group_id = p_group_id
    and user_id = p_user_id;

  if not found then
    raise exception 'Participant is not a member of this group';
  end if;

  delete from public.conversation_members cm
  using public.groups g
  where g.id = p_group_id
    and cm.conversation_id = g.conversation_id
    and cm.user_id = p_user_id;
end;
$$;

grant execute on function public.rc_group_set_admin(uuid, uuid, boolean) to authenticated;
grant execute on function public.rc_group_remove_member(uuid, uuid) to authenticated;
