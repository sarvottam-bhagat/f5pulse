# CLAUDE.md

This file tells Claude Code (and any future contributor) how this repository is organized and how to work in it.

## What this is

F5 Pulse is an internal operations tool for F5 — a company that places dedicated full-time remote professionals with US businesses and manages the placements for the life of the engagement. One person on F5's team is responsible for keeping every client happy and every professional performing across dozens of active placements at once. This tool answers their first question every morning: **who do I contact today, and why?**

It's a standalone Next.js 16 (App Router) + TypeScript app. No separate backend or database — a JSON seed dataset supplies realistic sample data, and all runtime changes live in browser `localStorage` on top of it.

## How this was built

Every feature in this repo traces back to a single planning document worked through as a linear task list (19 tasks), building bottom-up:

1. **Domain layer first** (`src/domain/`) — types, date/cadence helpers, and a pure-function rules engine — before any UI existed. This let the hardest logic (trial cadence, silence thresholds, issue lifecycle, mandatory escalation, health-state precedence) get unit-tested in isolation, with ~79 passing tests, before it ever had to render anything.
2. **Seed data was code, not hand-typed JSON.** `scripts/seed-source-data.ts` hand-authors 12 specific scenarios (healthy trial, overdue feedback, silent client, repeated lateness, full-shift absence, underperformance, client complaint, fix-in-monitoring, recurring issue, replacement request, security escalation, month-six check-in) and then bulk-generates the rest with a seeded PRNG so the dataset is large (18 clients, 50 professionals, 40 placements, 200+ attendance records, 150+ communications) but reproducible. Run `npm run seed` to regenerate it.
3. **Store before UI.** `src/store/` wraps the rules engine's pure mutation functions in a `localStorage`-backed class with a `useSyncExternalStore` React hook, so every page just calls `store.someMutation(...)` and re-renders automatically — no prop drilling, no manual cache invalidation.
4. **UI built and verified in a real browser at every step**, not just typechecked. I used Playwright throughout development to click through each feature after building it — the dashboard, the wizard, Chat, the action sheets — checking for console errors and confirming mutations actually persisted to `localStorage`. A few real bugs (an SSR/hydration mismatch in the storage-mode indicator, a same-day date-comparison bug in follow-up window logic, an off-by-scenario test that was actually exercising the escalation engine correctly rather than revealing a bug) were caught this way, not by typechecking alone.
5. **Chat's AI path was built to degrade honestly.** The Claude API integration (`/api/chat`) is a thin server route; if it's unavailable (no API key, network failure, rate limit), the client catches the failure, shows a visible "AI service is unavailable" banner, and falls back to fully deterministic, rules-engine-backed answers (`src/domain/chat/deterministicSummaries.ts`) — verified by running with no API key configured and confirming the fallback fires correctly.

## Where things live

```
src/domain/            Pure business logic. No React, no I/O. This is the source of truth for "what does the business rule say."
  types.ts             Every domain entity (Client, Professional, Placement, Issue, Escalation, ...)
  dates.ts             Fixed "demo today" date handling — NEXT_PUBLIC_DEMO_DATE env var, or a hardcoded default
  cadence.ts           The actual cadence/threshold constants from the brief (trial day offsets, silence thresholds, SLA hours)
  rules/               The rules engine: health.ts (precedence), silence.ts, escalation.ts, issueLifecycle.ts (state machine),
                        priority.ts (dashboard queue), summary.ts (tile counts), insights.ts, timeline.ts, clientView.ts, professionalView.ts
  chat/                Chat-specific domain logic: context resolution, deterministic fallback answers, prompt building, response parsing

src/store/              The application's persistence layer.
  mutations.ts          Pure (Seed, input) -> Seed functions — one per user action. Fully unit-testable without touching localStorage.
  Store.ts               Wraps mutations.ts, persists to localStorage, notifies subscribers.
  seedData.ts / validateSeed.ts   Loads + sanity-checks the JSON seed (drops any record with a dangling foreign key).

src/components/         React components, grouped by feature (dashboard/, wizard/, chat/, detail/, ui/, layout/).
src/app/                Next.js App Router pages. Thin — they wire store + rules engine into components, not where logic lives.
scripts/seed-source-data.ts   Regenerates src/data/seed/*.json. Never hand-edit those JSON files — edit this script and rerun `npm run seed`.
```

## Rules the app enforces (and where)

These came directly from the assessment brief's prose description of the job, translated into code:

- **Trial cadence**: client feedback at days 2/7/14/21/30; professional check-ins at days 3/10/21/30; every 30 days after trial. `src/domain/cadence.ts`, generated by `src/domain/rules/checkpoints.ts`.
- **Silence risk**: trial feedback is Watch after 1 day overdue, At Risk after 3; post-trial is Watch after 3, At Risk after 7; two-or-more unanswered contact attempts is always at least Watch, regardless of day count. `src/domain/rules/silence.ts`.
- **Issue lifecycle**: `Reported → Investigating → Fix in progress → Monitoring → Closed`, with `Fix in progress → Closed` explicitly disallowed (must pass through Monitoring). Marking a fix implemented auto-generates 24h/3d/7d confirmation follow-ups. A window confirmed "recurred" reopens the issue to Fix in progress *and* raises a mandatory escalation. `src/domain/rules/issueLifecycle.ts` — enforced again at the store boundary (`updateIssueStatus` rejects illegal transitions) so the UI can never force an invalid state even by accident.
- **Mandatory escalation**: cancellation/replacement mentioned, security/confidentiality/harassment/compliance/payroll/safety, full-shift absence with no contact, high-severity issue unowned for 4+ hours, critical issue with no fix for 24+ hours, recurrence during monitoring, red trial feedback. `src/domain/rules/escalation.ts`.
- **Health-state precedence**: `Critical > At Risk > Watch > Healthy`, highest-matching-state wins, and the UI always shows the exact reasons that produced it (never just the label). `src/domain/rules/health.ts`.

## Conventions

- **No comments explaining what code does** — names should do that. Comments exist only for non-obvious *why* (a workaround, an invariant, a deliberate design tradeoff).
- **Rules engine functions are pure** — `(data, asOf) -> result`. No `Date.now()`, no hidden state. This is what makes them trivially testable and what makes the "fixed configurable demo date" requirement (`NEXT_PUBLIC_DEMO_DATE`) actually work — change the env var and every rule recalculates consistently.
- **Mutations are pure too** — `mutations.ts` functions take a `Seed` and return a new `Seed`; `Store.ts` is the only thing that actually touches `localStorage` or notifies React. This is what makes "create placement bundle is atomic" true by construction: either the whole mutation succeeds and one new `Seed` is returned, or it returns an error and nothing is touched.
- **The AI never writes data directly.** Every Chat capability that could change state returns a `PROPOSED_ACTION: {...}` marker in its response; the UI renders that as a distinct confirm/dismiss card, and only a user click calls the actual store mutation. See `src/domain/chat/parseResponse.ts` and `src/components/chat/ProposedActionCard.tsx`.
- **Mobile is not an afterthought.** Every interactive surface (filters, context pickers, wizard steps, action forms) is a `BottomSheet`, not a modal dialog or a desktop-style dropdown, and every tap target is at least 44px (`.tap-target` in `globals.css`).

## Running it

```bash
npm install
npm run seed      # regenerate src/data/seed/*.json (only needed if you edit scripts/seed-source-data.ts)
npm run dev        # http://localhost:3000
npm test           # vitest
npm run build      # production build (verified clean before every deploy)
```

Set `ANTHROPIC_API_KEY` to enable live Chat responses. Without it, Chat still works — every capability falls back to deterministic, rules-engine-backed answers and clearly labels them as such.

## Known trade-offs / what I'd do with more time

- Live Gmail/Slack sending was deliberately never attempted — the plan calls for it only after OAuth and draft creation are verified reliable on the deployed URL, and a demo assessment isn't the place to gate correctness on a third-party OAuth flow. The draft → copy → mark-as-sent flow is fully real; the `IntegrationAdapter` interface (`src/domain/integrations/types.ts`) is where a live Composio-backed adapter would plug in later without touching any calling code.
- The Chat capability router (`src/app/chat/page.tsx`) uses lightweight keyword matching to route deterministic fallback questions to the right canned answer. It's good enough for the assessment's scope; a production version would probably have the model itself decide which deterministic tool to call rather than string-matching the user's question.

