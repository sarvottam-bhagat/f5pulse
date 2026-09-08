# F5 Pulse — Revised Test 2 Plan

## Summary

Build a mobile-friendly internal F5 operations tool that answers:

> Who should I contact today, why, and what should happen next?

The system manages:

**US Client → Placement/Engagement → Remote Professional**

Use realistic JSON as initial sample data while allowing the F5 operator to create new clients, professionals and placements through a guided flow.

Primary navigation:

- **Home:** operational dashboard and actions
- **Chat:** investigate cases, prepare communication and complete actions

Secondary placement, client and professional detail pages open from dashboard records.

## Home Dashboard

### Immediate morning summary

Show within five seconds:

- Contacts due today
- Escalations requiring attention
- Trial placements
- Silent clients
- Overdue check-ins
- Fixes awaiting confirmation

Every metric acts as a filter.

### Priority queue

Organize work into:

1. **Escalate now**
2. **Contact today**
3. **Confirm the fix held**
4. **Next three days**

Each card shows:

- Client and professional
- Who F5 should contact
- Exact reason
- Risk level
- Supporting evidence
- Due time
- Recommended action
- “Why this is here”

Actions include:

- Log outcome
- Record feedback
- Investigate in Chat
- Create issue
- Schedule follow-up
- Escalate

### Additional insights

- Trial-period radar
- Placement health: Healthy, Watch, At Risk or Critical
- Client feedback and silence trends
- Professional attendance and performance signals
- Issue pipeline
- Recurring problems
- Upcoming monthly check-ins
- Follow-up calendar

## Add Placement Flow

Use one primary dashboard button: **Add Placement**.

### Step 1: US client

The operator can:

- Select an existing client, or
- Create a new client

New-client fields:

- Company name
- Industry
- Primary contact name
- Contact title
- Email
- Phone
- US time zone
- Preferred communication channel
- Notes

### Step 2: Professional

The operator can:

- Select an existing unassigned professional, or
- Create a new professional

New-professional fields:

- Full name
- Role
- Email
- Phone
- Country
- Time zone
- Working hours
- F5 manager
- Notes

A professional can have only one active full-time placement. Historical placements remain available.

### Step 3: Placement

Fields:

- Client
- Professional
- Role title
- Start date
- Trial-end date
- F5 owner
- Expected working schedule
- Initial notes
- Status: Upcoming or Active

### Creation result

The wizard commits all three records only after final confirmation. Cancelling does not leave partial records.

After creation, the system automatically:

- Creates trial client-feedback checkpoints
- Creates professional check-ins
- Creates monthly post-trial check-ins
- Calculates placement health
- Adds upcoming work to the dashboard
- Makes the placement available in Chat
- Adds a creation entry to the audit timeline

Show a success screen containing:

- Placement summary
- First client contact date
- First professional check-in
- “View Placement”
- “Open in Chat”

## Placement, Client and Professional Details

### Client detail

Show:

- Company and contacts
- Active and historical placements
- Feedback history
- Communication history
- Open issues
- Satisfaction and silence signals

Client actions:

- Record feedback
- Log contact
- Draft email
- Schedule check-in
- Open issue
- Escalate cancellation or replacement risk

### Professional detail

Show:

- Role and working schedule
- Current and historical placements
- Attendance
- Performance feedback
- Coaching history
- Open concerns

Professional actions:

- Log contact
- Record attendance event
- Add coaching note
- Create improvement plan
- Draft email
- Schedule check-in
- Escalate serious concern

### Placement detail

Use one shared timeline containing:

- Start and trial-end dates
- Client feedback
- Professional check-ins
- Attendance exceptions
- Issues
- Fixes
- Follow-ups
- Communications
- Escalations

Primary action: **Log Outcome**

Capture:

- Client or professional
- Reached or no answer
- Sentiment
- Summary
- Commitment
- Owner
- Next follow-up date
- Create issue toggle
- Escalate toggle

## Chat

Use one placement-centered conversation rather than separate histories.

### Context attachments

Users can attach:

- Client
- Professional
- Placement
- Issue

Selecting a professional automatically attaches their placement and client. Selecting a client with several professionals requires choosing the relevant placement.

### Client and Professional views

Inside the same Chat, provide:

- **Client view:** feedback, satisfaction, complaints and client-facing communication.
- **Professional view:** attendance, performance, coaching and professional-facing communication.

Both views retain the entire placement history.

### Chat capabilities

- Summarize the placement
- Explain why it is at risk
- Prepare call talking points
- Compare complaints with attendance and previous notes
- Recommend escalation
- Draft client feedback requests
- Draft complaint responses
- Draft professional coaching emails
- Create improvement plans
- Recommend issue resolutions
- Identify required follow-ups

### Chat actions

AI responses can propose:

- Log contact
- Record feedback
- Create issue
- Schedule follow-up
- Mark fix implemented
- Create escalation
- Start replacement review

The AI cannot modify data directly. The operator must review and confirm the proposed action.

If the AI service fails, deterministic summaries, communication templates and manual action buttons remain available.

## Data and Storage

### Seed data

Provide approximately:

- 18 US clients
- 40 professionals
- 36 active placements
- 4 historical placements
- 100+ feedback and check-in records
- 200+ attendance records
- 30+ issues
- 150+ communication records
- Multiple follow-ups and escalations

Include every significant scenario:

- Healthy early trial
- Trial feedback overdue
- Silent client
- Repeated lateness
- Full-shift absence
- Underperformance
- Client complaint
- Fix in monitoring
- Recurring issue
- Replacement request
- Security escalation
- Routine month-six check-in

### JSON files

- `clients.json`
- `professionals.json`
- `placements.json`
- `feedback.json`
- `attendance.json`
- `checkins.json`
- `issues.json`
- `followups.json`
- `communications.json`
- `escalations.json`

### Runtime persistence

- JSON supplies the original dataset.
- Created and modified records use browser storage.
- Refreshing preserves changes.
- Dashboard insights recalculate after every mutation.
- A **Reset Demo Data** action restores the original JSON.
- Use a fixed configurable demo date so deadlines remain predictable.

### Core store interface

Support atomic operations for:

- Create placement bundle
- Update client
- Update professional
- Archive placement
- Log communication
- Record feedback
- Record attendance
- Create/update issue
- Implement fix
- Complete follow-up
- Create escalation
- Reset demo data

Archiving is preferred over permanent deletion.

## Operating Rules

### Contact cadence

Assume a 30-day trial while storing each placement’s real trial end.

Client feedback:

- Days 2, 7, 14, 21 and 30

Professional check-ins:

- Days 3, 10, 21 and 30

After trial:

- Client and professional check-ins every 30 days

### Silence risk

- Trial feedback: Watch after one overdue day; At Risk after three.
- Post-trial feedback: Watch after three overdue days; At Risk after seven.
- Two unanswered attempts create silence risk.
- Negative client feedback creates an issue.

### Issue lifecycle

**Reported → Investigating → Fix in progress → Monitoring → Closed**

- Issues cannot move directly from Fix in progress to Closed.
- Marking a fix implemented creates 24-hour, 3-day and 7-day follow-ups.
- Failed confirmation reopens the issue.
- Recurrence during monitoring creates an escalation.

### Mandatory escalation

Escalate when:

- Client mentions cancellation or replacement.
- Security, confidentiality, harassment, compliance, payroll or safety is involved.
- Professional misses a complete shift without contact.
- High-severity issue has no owner within four hours.
- Critical issue has no credible fix within 24 hours.
- Issue recurs during monitoring.
- Client feedback reaches red status during trial.

### Health states

Apply the highest matching state:

- **Critical:** mandatory escalation.
- **At Risk:** serious unresolved issue, negative feedback or red silence.
- **Watch:** overdue checkpoint, attendance concern or monitoring.
- **Healthy:** no overdue tasks or unresolved negative signals.

Always display the exact reasons contributing to the health state.

## Technical Approach

Use one standalone Next.js and TypeScript application.

- Tailwind CSS
- Pure TypeScript rules engine
- JSON seed repository
- Versioned browser-storage application store
- Next.js server route for optional AI Chat
- OpenAI adapter following the ParcelPilot pattern
- Vercel deployment
- No separate database or backend

Data flow:

**JSON/browser records → rules engine → insights and priority queue → confirmed action → store update → automatic recalculation**

## Gmail and Slack

Core demo:

- Generate editable email/Slack drafts
- Copy draft
- Mark as sent
- Add communication to placement timeline
- Schedule next follow-up

Optional Composio integration:

- Use an integration adapter with demo and live implementations.
- Attempt Gmail draft creation only after the complete core demo passes.
- Never send email automatically.
- Enable live Gmail only if OAuth and draft creation work reliably on the deployed URL.
- Keep Slack as a stretch feature.
- Hide unavailable integration controls.
- Integration failure must never affect Home, Chat or manual drafts.

## Error and Mobile Behavior

### Required states

- Loading skeletons
- Empty “all caught up” state
- Stale-data warning with last successful queue
- Retryable Chat error
- No search results
- Malformed seed record warning
- Browser-storage failure with temporary-mode fallback
- Wizard validation and safe cancellation

### Mobile requirements

- Single-column priority cards
- Sticky today summary
- 44-pixel minimum touch targets
- No horizontal dependency
- Actions remain visible
- Context and filters open as bottom sheets
- Add Placement wizard uses one step per screen

## Testing

### Rules

Test:

- Trial cadence boundaries
- Monthly check-ins
- Silence thresholds
- Escalation conditions
- Health precedence
- Issue transitions
- Automatic monitoring follow-ups
- Recurrence reopening and escalation
- Priority ordering and explanations

### Creation flow

Test:

- New client + new professional + placement
- Existing client + new professional
- Existing client + existing available professional
- Duplicate active professional rejection
- Cancel without partial records
- Automatic task generation
- Immediate dashboard recalculation
- Persistence after refresh
- Reset to original JSON

### User workflows

Test:

- Identify first contact within five seconds
- Log client contact
- Record negative feedback
- Create issue
- Implement fix
- Complete follow-up
- Trigger recurring-issue escalation
- Open dashboard item in Chat
- Switch Client/Professional Chat views
- Generate communication draft
- Use Chat fallback
- Mobile and keyboard navigation

## Submission

Deliver:

- Public no-login URL
- Repository
- `CLAUDE.md`
- Walkthrough video under three minutes

### Walkthrough

- Open mobile Home and identify the first contact.
- Explain priority sections and health reasons.
- Create a new client, professional and placement.
- Show automatically generated trial tasks.
- Log a client outcome.
- Investigate the placement in Chat.
- Draft client communication.
- Implement a fix and show follow-ups.
- Trigger an automatic escalation.
- Briefly show error states and tests.

## Assumptions

- This is an internal F5 operator tool.
- The client and professional are connected through a placement.
- JSON seed data and browser storage are sufficient for the assessment.
- Users can create new placement bundles through one wizard.
- Full independent CRUD administration is outside the MVP.
- Professionals can have only one active full-time placement.
- Rules determine priority; AI explains and assists.
- Gmail/Slack integration remains optional.
