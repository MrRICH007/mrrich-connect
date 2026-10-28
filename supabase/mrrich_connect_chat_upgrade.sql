-- MR RICH CONNECT chat upgrade schema
alter table public.messages add column if not exists edited_at timestamptz, add column if not exists deleted_at timestamptz, add column if not exists message_type text not null default 'text', add column if not exists media_path text;
alter table public.messages drop constraint if exists messages_message_type_check;
alter table public.messages add constraint messages_message_type_check check (message_type in ('text','voice'));

create table if not exists public.user_blocks (
 blocker_id uuid not null references auth.users(id) on delete cascade,
 blocked_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (blocker_id, blocked_id),
 check (blocker_id <> blocked_id)
);
alter table public.user_blocks enable row level security;
drop policy if exists "Users can view their own blocks" on public.user_blocks;
create policy "Users can view their own blocks" on public.user_blocks for select to authenticated using (auth.uid() = blocker_id);
drop policy if exists "Users can create their own blocks" on public.user_blocks;
create policy "Users can create their own blocks" on public.user_blocks for insert to authenticated with check (auth.uid() = blocker_id and auth.uid() <> blocked_id);
drop policy if exists "Users can remove their own blocks" on public.user_blocks;
create policy "Users can remove their own blocks" on public.user_blocks for delete to authenticated using (auth.uid() = blocker_id);

create table if not exists public.hidden_conversations (
 user_id uuid not null references auth.users(id) on delete cascade,
 conversation_id uuid not null references public.conversations(id) on delete cascade,
 hidden_at timestamptz not null default now(),
 primary key (user_id, conversation_id)
);
alter table public.hidden_conversations enable row level security;
drop policy if exists "Users can view their hidden conversations" on public.hidden_conversations;
create policy "Users can view their hidden conversations" on public.hidden_conversations for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Users can hide their own conversations" on public.hidden_conversations;
create policy "Users can hide their own conversations" on public.hidden_conversations for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.conversation_members cm where cm.conversation_id = hidden_conversations.conversation_id and cm.user_id = auth.uid()));
drop policy if exists "Users can unhide their own conversations" on public.hidden_conversations;
create policy "Users can unhide their own conversations" on public.hidden_conversations for delete to authenticated using (auth.uid() = user_id);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('rc-voice-notes','rc-voice-notes',false,20971520,array['audio/webm','audio/ogg','audio/mp4','audio/mpeg','audio/wav'])
on conflict (id) do update set public=false,file_size_limit=20971520,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Members upload voice notes" on storage.objects;
create policy "Members upload voice notes" on storage.objects for insert to authenticated with check (bucket_id='rc-voice-notes' and (storage.foldername(name))[2]=auth.uid()::text and exists (select 1 from public.conversation_members cm where cm.conversation_id::text=(storage.foldername(name))[1] and cm.user_id=auth.uid()));
drop policy if exists "Members read voice notes" on storage.objects;
create policy "Members read voice notes" on storage.objects for select to authenticated using (bucket_id='rc-voice-notes' and exists (select 1 from public.conversation_members cm where cm.conversation_id::text=(storage.foldername(name))[1] and cm.user_id=auth.uid()));
drop policy if exists "Owners delete voice notes" on storage.objects;
create policy "Owners delete voice notes" on storage.objects for delete to authenticated using (bucket_id='rc-voice-notes' and (storage.foldername(name))[2]=auth.uid()::text);

create or replace function public.guard_message_owner_changes() returns trigger language plpgsql security invoker set search_path=public as $$
begin
 if auth.uid() is not null and old.sender_id <> auth.uid() then raise exception 'You can only edit or delete your own messages'; end if;
 return new;
end;
$$;
drop trigger if exists guard_message_owner_changes on public.messages;
create trigger guard_message_owner_changes before update on public.messages for each row execute function public.guard_message_owner_changes();
