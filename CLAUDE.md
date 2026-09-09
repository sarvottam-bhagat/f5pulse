# CLAUDE.md

This file explains F5 Pulse to Claude Code and future contributors: what the product must accomplish, where its rules live, and how changes should be made and verified.

## Product goal

F5 Pulse is an internal operations tool for F5, which places dedicated full-time remote professionals with US businesses and manages each placement for the life of the engagement. One F5 operator is responsible for keeping every client happy and every professional performing across dozens of placements.

The Home screen must answer one question within seconds:

> Who do I contact today, and why?

The answer is derived from trial timing, scheduled client feedback, client silence, professional check-ins, attendance, unresolved issues, fix-confirmation windows, and mandatory escalation rules. Every priority card must name the client, professional, reason, evidence, due date, and recommended action.

## Current architecture

F5 Pulse is a Next.js 16 App Router application written in TypeScript.

- **Operational demo data:** reproducible JSON under `src/data/seed/`.
- **Operational runtime changes:** the browser store in `src/store/`, persisted to `localStorage`. Creating placements, recording feedback or contact, completing follow-ups, and changing escalation status update this store immediately.
- **Business decisions:** pure functions under `src/domain/`; React components do not invent counts, health states, or priorities.
- **Chat identity and history:** anonymous Supabase Auth plus `chat_sessions` and `chat_messages` tables protected by row-level security. A user sees only the conversations owned by that anonymous identity.
- **AI responses:** the OpenAI Responses API, called only from the server route. Responses stream to the UI as NDJSON text deltas, and OpenAI-side response storage is disabled.

Supabase currently stores Chat history only. It is not the source of truth for clients, professionals, placements, issues, feedback, or operational actions.

## How the repository is organized

```text
src/domain/                     Pure types and business logic; no React or storage I/O
  cadence.ts                    Trial, silence, follow-up, and escalation thresholds
  dates.ts                      Fixed configurable demo date
  rules/                        Priority, health, silence, escalation, lifecycle, timeline, and workflow queues
  chat/                         Prompt, supplied context, deterministic fallback summaries, and stream types

src/store/                      Operational state and mutations
  mutations.ts                  Pure (Seed, input) -> result functions
  Store.ts                      localStorage persistence and subscriber notification
  seedData.ts                   Loads the original JSON dataset
  validateSeed.ts               Removes malformed and dangling records

src/services/chat/              Chat orchestration
  openaiAgent.ts                OpenAI Responses API and streaming adapter
  chatTurnHandler.ts            Authentication, context, history, persistence, and fallback handling
  chatRepository.ts             User-scoped Supabase persistence

src/lib/supabase/               Browser/server Supabase clients and environment validation
src/components/                 UI grouped by dashboard, clients, detail, wizard, chat, and shared controls
src/app/                        Thin App Router pages and `/api/chat`
supabase/migrations/            Chat schema and general-session migration
supabase/tests/                 Row-level-security checks
scripts/seed-source-data.ts     Reproducibly regenerates `src/data/seed/*.json`
```

Do not hand-edit generated seed JSON. Change `scripts/seed-source-data.ts` and run `npm run seed`.

## Business rules

These are product behavior, not presentation details.

### Placement cadence

- A trial lasts 30 days.
- Client feedback checkpoints occur on days 2, 7, 14, 21, and 30.
- Professional trial check-ins occur on days 3, 10, 21, and 30.
- Client and professional check-ins continue every 30 days after trial.
- Creating a placement generates its initial feedback and check-in schedule.

Source: `src/domain/cadence.ts` and `src/domain/rules/checkpoints.ts`.

### Client silence

- During trial, feedback becomes Watch after 1 overdue day and At Risk after 3.
- After trial, feedback becomes Watch after 3 overdue days and At Risk after 7.
- Two unanswered attempts are always a silence risk.
- Client feedback is a stronger health signal than routine activity; silence must never be treated as neutral.

Source: `src/domain/rules/silence.ts`.

### Issues and fixes

The valid issue lifecycle is:

```text
Reported -> Investigating -> Fix in progress -> Monitoring -> Closed
```

An issue cannot move directly from Fix in progress to Closed. Implementing a fix creates 24-hour, 3-day, and 7-day confirmation windows. A recurrence during Monitoring reopens the issue and triggers escalation.

Source: `src/domain/rules/issueLifecycle.ts` and the guarded mutations in `src/store/mutations.ts`.

### Mandatory escalation

Escalate when the data shows any of the following:

- cancellation or replacement is mentioned;
- security, confidentiality, harassment, compliance, payroll, or safety risk;
- a full shift is missed without contact;
- a high-severity issue has no owner after four hours;
- a critical issue has no credible fix after 24 hours;
- an issue recurs during monitoring;
- trial feedback reaches red/At Risk.

Karan is the current operator and Ankita is the senior manager. A recorded escalation leaves the “Escalate now” queue and moves into the visible lifecycle:

```text
Awaiting Ankita -> Acknowledged by Ankita -> Resolved
```

Source: `src/domain/rules/escalation.ts`, `src/domain/rules/workflowQueues.ts`, and `src/components/dashboard/WorkflowClosureSection.tsx`.

### Follow-through and check-in completion

- A reached Log outcome completes the earliest due check-in for the same placement and subject.
- A no-answer outcome leaves that check-in open.
- Open follow-ups remain in the dashboard queue in due-date order until an outcome is recorded.
- Completing a follow-up retains it in history instead of deleting it.
- Raised escalations remain visible through acknowledgment and resolution.

### Health precedence

The highest matching state wins:

```text
Critical > At Risk > Watch > Healthy
```

Every displayed health state must include the data signals that caused it. Source: `src/domain/rules/health.ts`.

## Chat behavior

Chat is a read-only operations assistant.

- With no attachment, it receives portfolio context and can answer questions such as total clients, contacts due today, risk distribution, and open issues.
- `@` attaches a client; `/` then selects an active professional/placement under that client.
- With an attachment, the agent receives the selected client, professional, placement, feedback, attendance, check-ins, issues, fixes, follow-ups, communications, and escalations.
- The system prompt requires answers to use only supplied F5 context, separate facts from recommendations, and never invent records or claim an action was performed.
- The user message appears as soon as it has been saved, and assistant text streams into the current response.
- If OpenAI fails, the server saves a deterministic rules-backed placement or portfolio summary with failed/fallback metadata.

Chat sessions are private per anonymous Supabase identity. Opening the deployed URL in another browser or cleared browser profile creates a different identity and therefore a different conversation list.

## Empty, loading, and error behavior

- A portfolio with no active placements shows “No active placements yet” and an Add Placement action; it must not show an endless skeleton.
- Empty dashboard lanes, follow-up queues, escalation trackers, search results, and missing detail records have explicit empty states.
- Chat history has loading and failure states; send failures expose a retry action.
- Storage failures and malformed seed records display visible banners.
- Forms keep user input open and show inline validation or mutation errors.

## Mobile expectations

- The Home screen must show the morning answer without requiring navigation.
- Summary metrics and at least the first actionable client/reason should be visible in the initial phone view at typical mobile sizes.
- The two operations lanes become a mobile tab switcher.
- Interactive forms and actions use bottom sheets.
- `.tap-target` in `src/app/globals.css` keeps primary tap targets at least 44px high.
- Avoid horizontal scrolling and preserve readable client, professional, reason, and action labels.

## How to work in this repository

1. Read `AGENTS.md` and the relevant guide in `node_modules/next/dist/docs/` before changing Next.js code; this project uses a version with breaking changes.
2. Translate the requested outcome into observable acceptance behavior before editing implementation code.
3. Add or update a focused failing test before implementing a feature or bug fix.
4. Keep business logic and mutations pure. UI components should consume derived results instead of reimplementing rules.
5. Preserve existing local changes and avoid unrelated refactors.
6. Keep browser-only behavior inside Client Components and ensure the server snapshot matches the first client render.
7. Never expose `OPENAI_API_KEY`, Supabase secrets, or service-role credentials to the browser.
8. Before claiming completion, run focused lint, the full test suite, a production build, and a browser check when visual behavior changed.

At the time of this update, the repository has 152 passing Vitest tests. Treat the command output, not this number, as authoritative because the suite will grow.

## Local setup

Create `.env.local` with:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-5.6-terra
NEXT_PUBLIC_DEMO_DATE=2026-09-08
```

`NEXT_PUBLIC_DEMO_DATE` is optional; the application has a stable default demo date. Use a Supabase publishable key, never a secret or service-role key. `OPENAI_API_KEY` is server-only and must not use a `NEXT_PUBLIC_` prefix.

```powershell
npm install
npx supabase db push --linked
npm run dev
```

Anonymous sign-ins must be enabled in the linked Supabase project.

## Verification

```powershell
npm test
npm run build
```

For changed TypeScript or TSX files, also run ESLint on those paths. For visual changes, verify the affected flow in a real browser at desktop and mobile widths and check the console.

## Known trade-offs

- Operational entities and actions are JSON plus per-browser localStorage, not shared server data. This is appropriate for the assessment demo, but a production multi-user tool should move them to a shared database with authorization and audit policies.
- The Chat API currently builds context from the original seed dataset. New placements, feedback, follow-ups, and escalations created only in localStorage are not included in later Chat answers. A production version should read operational state from the same server-side source of truth.
- Gmail and Slack adapters are demo adapters. Draft/copy/log flows are real, but no external email or Slack message is sent.
- Supabase anonymous sessions are intentionally private per browser identity; they are not a shared company-wide conversation list.
