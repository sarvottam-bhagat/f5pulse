create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  placement_id text not null,
  client_id text not null,
  professional_id text not null,
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index chat_sessions_owner_updated_idx
  on public.chat_sessions (user_id, updated_at desc);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 50000),
  status text not null default 'complete'
    check (status in ('pending', 'complete', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (session_id, user_id)
    references public.chat_sessions (id, user_id) on delete cascade
);

create index chat_messages_session_created_idx
  on public.chat_messages (session_id, created_at);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

revoke all on table public.chat_sessions from anon, authenticated;
revoke all on table public.chat_messages from anon, authenticated;
grant select, insert, update, delete on table public.chat_sessions to authenticated;
grant select, insert, update, delete on table public.chat_messages to authenticated;

create policy "chat_sessions_select_own"
  on public.chat_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "chat_sessions_insert_own"
  on public.chat_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "chat_sessions_update_own"
  on public.chat_sessions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "chat_sessions_delete_own"
  on public.chat_sessions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "chat_messages_select_own"
  on public.chat_messages for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "chat_messages_insert_own"
  on public.chat_messages for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "chat_messages_update_own"
  on public.chat_messages for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "chat_messages_delete_own"
  on public.chat_messages for delete to authenticated
  using ((select auth.uid()) = user_id);
