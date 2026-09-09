alter table public.chat_sessions
  alter column placement_id drop not null,
  alter column client_id drop not null,
  alter column professional_id drop not null;

alter table public.chat_sessions
  add constraint chat_sessions_context_complete
  check (
    (placement_id is null and client_id is null and professional_id is null)
    or
    (placement_id is not null and client_id is not null and professional_id is not null)
  );
