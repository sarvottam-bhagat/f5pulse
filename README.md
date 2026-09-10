# F5 Pulse

F5 Pulse is an operations tool for managing F5's client and professional placements. It answers the daily question: **Who should I contact today, and why?**

- Live app: [f5pulse.vercel.app](https://f5pulse.vercel.app)
- Repository: [github.com/sarvottam-bhagat/f5pulse](https://github.com/sarvottam-bhagat/f5pulse)

## Core features

- A five-second Home view of contacts due, mandatory escalations, trial placements, silent clients, overdue check-ins, and fixes awaiting confirmation.
- Prioritized **Needs attention** and **Next up** queues with the client, professional, reason, evidence, due date, and recommended action.
- Client and placement views covering health, trial timing, feedback, attendance, issues, communications, follow-ups, and escalation history.
- Actions to create placements, record feedback, log contact outcomes, create issues, schedule or complete follow-ups, and track escalations.
- Closed-loop escalation states: **Awaiting Ankita → Acknowledged → Resolved**.
- A streaming AI assistant for portfolio-wide questions or focused questions using an attached client (`@`) and active professional (`/`).
- Responsive desktop and mobile layouts with explicit loading, empty, validation, storage-failure, and Chat error states.

## Operational rules

- Placements have a 30-day trial with scheduled client feedback and professional check-ins.
- Client silence becomes more urgent as feedback becomes overdue; two unanswered attempts always create a risk signal.
- Health follows the highest matching state: **Critical > At Risk > Watch > Healthy**.
- Mandatory escalation covers cancellation or replacement signals, sensitive incidents, full-shift absence without contact, unowned high-severity issues, stale critical issues, recurrence after a fix, and at-risk trial feedback.
- A fix creates 24-hour, 3-day, and 7-day confirmation windows. Recurrence during monitoring reopens the issue and triggers escalation.
- Reached check-in outcomes complete the earliest matching due check-in. Follow-ups and escalations remain visible until closed.

The complete rule definitions and implementation notes are documented in [CLAUDE.md](./CLAUDE.md).

## Data and Chat

The reproducible demo dataset is stored in `src/data/seed/`. Operational changes are saved to browser `localStorage`, so each browser has its own demo state.

Chat uses anonymous Supabase Auth. Sessions and messages are stored in Supabase with row-level security, so each anonymous browser identity can access only its own history. OpenAI is called from the server, responses stream to the browser, and OpenAI-side response storage is disabled.

The assistant is read-only: it can explain data, identify risks, recommend next steps, and draft text, but it cannot modify records or send email or Slack messages.

## Local setup

Install dependencies:

```powershell
npm install
```

Create `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-5.6-terra
NEXT_PUBLIC_DEMO_DATE=2026-09-08
```

`NEXT_PUBLIC_DEMO_DATE` is optional. Use a Supabase publishable key, never a service-role key. `OPENAI_API_KEY` must remain server-only.

Enable anonymous sign-ins in Supabase, then apply the committed migrations:

```powershell
npx supabase db push --linked
```

Start the application:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```powershell
npm run lint
npm test
npm run build
```

## Deployment

Configure these variables for Vercel Production and Preview:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
OPENAI_API_KEY
OPENAI_MODEL
```

`NEXT_PUBLIC_DEMO_DATE` can also be set when a fixed assessment date is required.
