begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, aud, role, email, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'rls-a@example.test', now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'rls-b@example.test', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

insert into public.chat_sessions
  (id, user_id, placement_id, client_id, professional_id, title)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'placement-a', 'client-a', 'professional-a', 'User A session');

insert into public.chat_messages
  (id, session_id, user_id, role, content)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'user', 'User A message');

select is((select count(*)::integer from public.chat_sessions), 1, 'user A reads own session');
select is((select count(*)::integer from public.chat_messages), 1, 'user A reads own message');

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

select is((select count(*)::integer from public.chat_sessions), 0, 'user B cannot read user A sessions');
select is((select count(*)::integer from public.chat_messages), 0, 'user B cannot read user A messages');

select is_empty(
  $$update public.chat_sessions set title = 'stolen'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning 1$$,
  'user B cannot update user A session'
);

select is_empty(
  $$update public.chat_messages set content = 'stolen'
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning 1$$,
  'user B cannot update user A message'
);

select is_empty(
  $$delete from public.chat_messages
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' returning 1$$,
  'user B cannot delete user A message'
);

select is_empty(
  $$delete from public.chat_sessions
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' returning 1$$,
  'user B cannot delete user A session'
);

select throws_ok(
  $$insert into public.chat_sessions
    (user_id, placement_id, client_id, professional_id, title)
    values ('11111111-1111-4111-8111-111111111111', 'placement-b', 'client-b', 'professional-b', 'forged')$$,
  '42501',
  'new row violates row-level security policy for table "chat_sessions"',
  'user B cannot insert a session owned by user A'
);

select throws_ok(
  $$insert into public.chat_messages
    (session_id, user_id, role, content)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'user', 'forged')$$,
  '42501',
  'new row violates row-level security policy for table "chat_messages"',
  'user B cannot insert a message owned by user A'
);

select * from finish();
rollback;
