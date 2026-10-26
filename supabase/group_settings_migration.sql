-- MR RICH CONNECT group settings and server-side enforcement.
-- Run in Supabase SQL Editor before using the new Group Settings screen.

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS member_limit integer NULL CHECK (member_limit IS NULL OR member_limit >= 100),
  ADD COLUMN IF NOT EXISTS allowed_levels text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allowed_schools text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS members_can_message boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.rc_enforce_group_member_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group public.groups%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_level text;
  v_count integer;
BEGIN
  SELECT g.* INTO v_group
  FROM public.groups g
  WHERE g.conversation_id = NEW.conversation_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT p.* INTO v_profile FROM public.profiles p WHERE p.id = NEW.user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Create a profile before joining this group.';
  END IF;

  IF cardinality(v_group.allowed_levels) > 0 THEN
    v_level := regexp_replace(lower(coalesce(v_profile.level, '')), '[^0-9a-z]', '', 'g');
    IF NOT EXISTS (
      SELECT 1 FROM unnest(v_group.allowed_levels) AS allowed(level)
      WHERE regexp_replace(lower(allowed.level), '[^0-9a-z]', '', 'g') = v_level
         OR (lower(allowed.level) = 'graduate' AND v_level LIKE '%graduate%')
         OR (v_level LIKE '%' || regexp_replace(lower(allowed.level), '[^0-9]', '', 'g') || '%'
             AND regexp_replace(lower(allowed.level), '[^0-9]', '', 'g') <> '')
    ) THEN
      RAISE EXCEPTION 'Your profile level is not allowed in this group.';
    END IF;
  END IF;

  IF cardinality(v_group.allowed_schools) > 0 AND NOT EXISTS (
    SELECT 1 FROM unnest(v_group.allowed_schools) AS allowed(school)
    WHERE lower(trim(allowed.school)) = lower(trim(coalesce(v_profile.school, '')))
  ) THEN
    RAISE EXCEPTION 'Your school is not allowed in this group.';
  END IF;

  IF v_group.member_limit IS NOT NULL THEN
    SELECT count(*) INTO v_count FROM public.conversation_members cm
    WHERE cm.conversation_id = NEW.conversation_id;
    IF v_count >= v_group.member_limit THEN
      RAISE EXCEPTION 'This group has reached its member limit.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rc_group_member_settings_guard ON public.conversation_members;
CREATE TRIGGER rc_group_member_settings_guard
BEFORE INSERT ON public.conversation_members
FOR EACH ROW EXECUTE FUNCTION public.rc_enforce_group_member_settings();

CREATE OR REPLACE FUNCTION public.rc_enforce_group_message_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group public.groups%ROWTYPE;
  v_is_admin boolean := false;
BEGIN
  SELECT g.* INTO v_group
  FROM public.groups g
  WHERE g.conversation_id = NEW.conversation_id;
  IF NOT FOUND OR v_group.members_can_message THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = NEW.sender_id)
    INTO v_is_admin;
  IF NEW.sender_id <> v_group.created_by AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Only this group admin can send messages.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rc_group_message_settings_guard ON public.messages;
CREATE TRIGGER rc_group_message_settings_guard
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.rc_enforce_group_message_settings();
