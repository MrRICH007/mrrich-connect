-- Run in Supabase SQL Editor to allow the app's realtime message listener to receive INSERT events.
-- Safe to run more than once.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- IMPORTANT: Keep Row Level Security enabled. Confirm that your existing SELECT policy on
-- public.messages permits authenticated users to read messages only in conversations they belong to.
-- Realtime obeys table permissions/RLS; publication membership alone does not bypass RLS.
