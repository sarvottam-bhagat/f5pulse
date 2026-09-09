# F5 Pulse

F5 Pulse helps one operations owner see which clients and placements need attention, understand why, and prepare the right follow-up. The contextual chat assistant is read-only: it can explain the attached client, professional, and placement data, but it cannot change records or contact anyone.

## Local setup

Install dependencies:

```powershell
npm install
```

Create a local `.env.local` file (it is ignored by Git):

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-5.6-terra
```

Use a Supabase publishable key, never a secret or service-role key. `OPENAI_API_KEY` is server-only and must not use a `NEXT_PUBLIC_` prefix.

In the linked Supabase project:

1. Enable anonymous sign-ins under Authentication settings.
2. Apply the committed migration with `npx supabase db push --linked`.
3. Run `npx supabase migration list --linked` and confirm the local and remote migration versions match.
4. Run the database RLS tests and security advisors before deploying.

Start the app:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Chat creates a private anonymous Supabase identity automatically, so there is no login screen. In the composer, use `@` to attach a client and `/` to choose one of that client's active professionals.

## Verification

```powershell
npm test
npx eslint src/app/api/chat/route.ts src/app/chat/page.tsx src/components/chat src/domain/chat src/hooks src/lib/supabase src/services/chat
npm run build
```

Chat sessions and messages are protected by row-level security. Each anonymous user can read and change only their own conversation history. OpenAI-side response storage is disabled because Supabase is the conversation system of record.
