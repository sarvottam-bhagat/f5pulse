// Deterministic seed data generator for F5 Pulse.
//
// Run with: npx tsx scripts/seed-source-data.ts
// Writes JSON files into src/data/seed/*.json.
//
// Strategy: a small set of HAND-AUTHORED placements each pin down one
// required scenario from the assessment brief (healthy trial, overdue trial
// feedback, silent client, repeated lateness, full-shift absence,
// underperformance, client complaint, fix in monitoring, recurring issue,
// replacement request, security escalation, routine month-six check-in).
// The remaining placements are bulk-generated with a seeded PRNG so the
// dataset reaches the volume called for in the plan while staying
// reproducible across runs.

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type {
  Client,
  Professional,
  Placement,
  FeedbackRecord,
  AttendanceRecord,
  CheckinRecord,
  Issue,
  Followup,
  Communication,
  Escalation,
  AuditEntry,
  ProfessionalRole,
  USTimeZone,
  PreferredChannel,
} from "../src/domain/types";
import { addDays, addHours, DEFAULT_DEMO_DATE } from "../src/domain/dates";
import {
  TRIAL_CLIENT_FEEDBACK_DAY_OFFSETS,
  TRIAL_PROFESSIONAL_CHECKIN_DAY_OFFSETS,
  TRIAL_LENGTH_DAYS,
} from "../src/domain/cadence";

const TODAY = DEFAULT_DEMO_DATE;

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) for reproducible "random" filler data.
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function uid(prefix: string, n: number): string {
  return `${prefix}_${String(n).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Reference lists
// ---------------------------------------------------------------------------
const INDUSTRIES = [
  "E-commerce",
  "SaaS",
  "Healthcare Services",
  "Real Estate",
  "Legal Services",
  "Home Services",
  "Financial Services",
  "Logistics",
  "Marketing Agency",
  "Hospitality",
  "Education Technology",
  "Insurance",
  "Retail",
  "Construction",
  "Nonprofit",
  "Manufacturing",
  "Consulting",
  "Media & Entertainment",
];

const US_TIMEZONES: USTimeZone[] = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
];

const CHANNELS: PreferredChannel[] = ["email", "phone", "slack", "video"];

const ROLES: ProfessionalRole[] = [
  "Customer Support Specialist",
  "Executive Assistant",
  "Bookkeeper",
  "Software Developer",
  "Data Entry Specialist",
  "Sales Development Rep",
  "Marketing Coordinator",
  "HR Coordinator",
  "Recruiter",
  "Graphic Designer",
];

const COUNTRIES_TZ: { country: string; tz: string }[] = [
  { country: "Philippines", tz: "Asia/Manila" },
  { country: "India", tz: "Asia/Kolkata" },
  { country: "Colombia", tz: "America/Bogota" },
  { country: "South Africa", tz: "Africa/Johannesburg" },
  { country: "Mexico", tz: "America/Mexico_City" },
  { country: "Philippines", tz: "Asia/Manila" },
  { country: "Nigeria", tz: "Africa/Lagos" },
  { country: "Argentina", tz: "America/Argentina/Buenos_Aires" },
];

const COMPANY_PREFIXES = [
  "Brightside", "Northfield", "Harborview", "Redstone", "Cascade", "Union Square",
  "Meridian", "Silverline", "Oakhaven", "Bluepeak", "Ironwood", "Sunridge",
  "Clearwater", "Pinecrest", "Wellspring", "Fairmont", "Crestline", "Lakeshore",
];
const COMPANY_SUFFIXES = ["Inc.", "LLC", "Group", "Partners", "Co.", "Studio", "Solutions"];

const FIRST_NAMES = [
  "Sarah", "James", "Maria", "David", "Priya", "Michael", "Grace", "Daniel",
  "Amara", "Kevin", "Lucia", "Robert", "Fatima", "Chris", "Elena", "Marcus",
  "Angela", "Tom", "Ana", "Jordan", "Ravi", "Emily", "Carlos", "Nina",
  "Brian", "Sofia", "Derek", "Chidi", "Hannah", "Victor", "Wendy", "Samuel",
];
const LAST_NAMES = [
  "Nguyen", "Patel", "Garcia", "Smith", "Okafor", "Reyes", "Johnson", "Kim",
  "Rodriguez", "Williams", "Silva", "Adeyemi", "Martinez", "Brown", "Cruz",
  "Lopez", "Santos", "Davis", "Mendoza", "Lee", "Torres", "Wilson", "Ibrahim",
];

function randomName() {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}
function randomCompany() {
  return `${pick(COMPANY_PREFIXES)} ${pick(COMPANY_SUFFIXES)}`;
}
function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

const F5_OWNERS = ["Jamie Ortiz", "Taylor Brooks", "Morgan Ellis"];
const F5_MANAGERS = ["Jamie Ortiz", "Taylor Brooks", "Morgan Ellis", "Casey Lin"];

// ---------------------------------------------------------------------------
// Accumulators
// ---------------------------------------------------------------------------
const clients: Client[] = [];
const professionals: Professional[] = [];
const placements: Placement[] = [];
const feedback: FeedbackRecord[] = [];
const attendance: AttendanceRecord[] = [];
const checkins: CheckinRecord[] = [];
const issues: Issue[] = [];
const followups: Followup[] = [];
const communications: Communication[] = [];
const escalations: Escalation[] = [];
const auditLog: AuditEntry[] = [];

let clientCounter = 0;
let proCounter = 0;
let placementCounter = 0;
let feedbackCounter = 0;
let attendanceCounter = 0;
let checkinCounter = 0;
let issueCounter = 0;
let followupCounter = 0;
let commCounter = 0;
let escalationCounter = 0;
let auditCounter = 0;

function makeClient(overrides: Partial<Client> = {}): Client {
  clientCounter += 1;
  const id = uid("client", clientCounter);
  const companyName = overrides.companyName ?? randomCompany();
  const contactName = randomName();
  const base: Client = {
    id,
    companyName,
    industry: pick(INDUSTRIES),
    primaryContactName: contactName,
    contactTitle: pick(["Operations Manager", "COO", "Founder", "VP Operations", "HR Director", "Office Manager"]),
    email: `${slug(contactName)}@${slug(companyName)}.com`,
    phone: `+1-${randInt(200, 989)}-${randInt(200, 989)}-${randInt(1000, 9999)}`,
    usTimeZone: pick(US_TIMEZONES),
    preferredChannel: pick(CHANNELS),
    notes: "",
    archived: false,
    createdAt: addDays(TODAY, -randInt(30, 400)),
  };
  return { ...base, ...overrides };
}

function makeProfessional(overrides: Partial<Professional> = {}): Professional {
  proCounter += 1;
  const id = uid("pro", proCounter);
  const fullName = overrides.fullName ?? randomName();
  const countryTz = pick(COUNTRIES_TZ);
  const base: Professional = {
    id,
    fullName,
    role: pick(ROLES),
    email: `${slug(fullName)}@f5talent.example`,
    phone: `+${randInt(1, 99)}-${randInt(100, 999)}-${randInt(1000, 9999)}`,
    country: countryTz.country,
    timeZone: countryTz.tz,
    workingHours: { start: "09:00", end: "17:00", timeZone: countryTz.tz },
    f5Manager: pick(F5_MANAGERS),
    notes: "",
    archived: false,
    createdAt: addDays(TODAY, -randInt(30, 400)),
  };
  return { ...base, ...overrides };
}

function trialEndFor(startDate: string): string {
  return addDays(startDate, TRIAL_LENGTH_DAYS);
}

function makePlacement(
  client: Client,
  professional: Professional,
  overrides: Partial<Placement> = {},
): Placement {
  placementCounter += 1;
  const id = uid("placement", placementCounter);
  const startDate = overrides.startDate ?? addDays(TODAY, -randInt(1, 200));
  const base: Placement = {
    id,
    clientId: client.id,
    professionalId: professional.id,
    roleTitle: professional.role,
    startDate,
    trialEndDate: overrides.trialEndDate ?? trialEndFor(startDate),
    f5Owner: pick(F5_OWNERS),
    expectedSchedule: "Mon-Fri, client business hours",
    initialNotes: "",
    status: "Active",
    archived: false,
    createdAt: startDate,
  };
  const p = { ...base, ...overrides };
  placements.push(p);
  auditCounter += 1;
  auditLog.push({
    id: uid("audit", auditCounter),
    placementId: p.id,
    action: "placement_created",
    detail: `Placement created for ${client.companyName} / ${professional.fullName}`,
    actor: p.f5Owner,
    at: `${p.createdAt}T09:00:00.000Z`,
  });
  return p;
}

// Generates the standard trial + post-trial checkpoint schedule for a
// placement, marking checkpoints in the past as completed (with a feedback
// record) unless the caller has already hand-authored overdue/silent ones.
function generateStandardCheckpoints(
  placement: Placement,
  opts: { skipDayOffsets?: number[]; makeCompleted?: boolean } = {},
) {
  const makeCompleted = opts.makeCompleted ?? true;
  const skip = new Set(opts.skipDayOffsets ?? []);

  for (const dayOffset of TRIAL_CLIENT_FEEDBACK_DAY_OFFSETS) {
    if (skip.has(dayOffset)) continue;
    const scheduledFor = addDays(placement.startDate, dayOffset);
    const isPast = scheduledFor < TODAY;
    feedbackCounter += 1;
    const record: FeedbackRecord = {
      id: uid("feedback", feedbackCounter),
      placementId: placement.id,
      subjectType: "client",
      scheduledFor,
      isTrialCheckpoint: true,
      dayOffset,
      attemptCount: isPast && makeCompleted ? 1 : 0,
      ...(isPast && makeCompleted
        ? {
            collectedAt: `${scheduledFor}T14:00:00.000Z`,
            sentiment: "positive" as const,
            summary: "Client reports things are going smoothly.",
          }
        : {}),
      createdAt: placement.createdAt,
    };
    feedback.push(record);
  }

  for (const dayOffset of TRIAL_PROFESSIONAL_CHECKIN_DAY_OFFSETS) {
    const dueDate = addDays(placement.startDate, dayOffset);
    const isPastDue = dueDate < TODAY;
    checkinCounter += 1;
    const record: CheckinRecord = {
      id: uid("checkin", checkinCounter),
      placementId: placement.id,
      subjectType: "professional",
      dueDate,
      isTrialCheckpoint: true,
      dayOffset,
      status: isPastDue ? "completed" : "scheduled",
      ...(isPastDue ? { completedAt: `${dueDate}T15:00:00.000Z`, notes: "No concerns reported." } : {}),
      createdAt: placement.createdAt,
    };
    checkins.push(record);
  }

  // Post-trial monthly checkpoints if placement predates trial end
  if (placement.trialEndDate < TODAY) {
    let monthDate = addDays(placement.trialEndDate, 30);
    let monthOffset = TRIAL_LENGTH_DAYS + 30;
    while (monthDate <= addDays(TODAY, 60)) {
      const isPastDue = monthDate < TODAY;
      for (const subjectType of ["client", "professional"] as const) {
        checkinCounter += 1;
        checkins.push({
          id: uid("checkin", checkinCounter),
          placementId: placement.id,
          subjectType,
          dueDate: monthDate,
          isTrialCheckpoint: false,
          dayOffset: monthOffset,
          status: isPastDue ? "completed" : "scheduled",
          ...(isPastDue
            ? { completedAt: `${monthDate}T15:00:00.000Z`, notes: "Routine monthly check-in, no issues." }
            : {}),
          createdAt: placement.createdAt,
        });
      }
      monthDate = addDays(monthDate, 30);
      monthOffset += 30;
    }
  }
}

function addCommunication(
  placement: Placement,
  overrides: Partial<Communication> & Pick<Communication, "subjectType" | "summary" | "owner">,
): Communication {
  commCounter += 1;
  const record: Communication = {
    id: uid("comm", commCounter),
    placementId: placement.id,
    channel: "email",
    direction: "outbound",
    outcome: "reached",
    createdAt: addDays(TODAY, -randInt(1, 10)),
    ...overrides,
  };
  communications.push(record);
  return record;
}

// ---------------------------------------------------------------------------
// SCENARIO 1: Healthy early trial (day 5, all green)
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Brightside Retail Group" });
  const professional = makeProfessional({ fullName: "Grace Lim", role: "Customer Support Specialist" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -5);
  const placement = makePlacement(client, professional, {
    startDate,
    initialNotes: "Strong first week, client very responsive.",
  });
  generateStandardCheckpoints(placement);
  addCommunication(placement, {
    subjectType: "client",
    summary: "Day 2 check-in call, client happy with onboarding.",
    owner: placement.f5Owner,
    channel: "phone",
    sentiment: "positive",
  });
}

// ---------------------------------------------------------------------------
// SCENARIO 2: Trial feedback overdue (day 9, day-7 checkpoint missed)
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Northfield Legal Partners" });
  const professional = makeProfessional({ fullName: "Marcus Reyes", role: "Bookkeeper" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -9);
  const placement = makePlacement(client, professional, {
    startDate,
    initialNotes: "Client is a solo-practice attorney, historically slow to respond.",
  });
  generateStandardCheckpoints(placement, { skipDayOffsets: [7] });
  // day-7 checkpoint left un-collected and overdue by 2 days
  feedbackCounter += 1;
  feedback.push({
    id: uid("feedback", feedbackCounter),
    placementId: placement.id,
    subjectType: "client",
    scheduledFor: addDays(startDate, 7),
    isTrialCheckpoint: true,
    dayOffset: 7,
    attemptCount: 1,
    createdAt: placement.createdAt,
  });
  addCommunication(placement, {
    subjectType: "client",
    summary: "Left voicemail requesting day-7 feedback call.",
    owner: placement.f5Owner,
    channel: "phone",
    outcome: "no_answer",
  });
}

// ---------------------------------------------------------------------------
// SCENARIO 3: Silent client (two unanswered attempts, trial day 12)
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Harborview Property Management" });
  const professional = makeProfessional({ fullName: "Priya Nair", role: "Executive Assistant" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -12);
  const placement = makePlacement(client, professional, {
    startDate,
    initialNotes: "Client was very engaged in week 1, has gone quiet since.",
  });
  generateStandardCheckpoints(placement, { skipDayOffsets: [7] });
  feedbackCounter += 1;
  feedback.push({
    id: uid("feedback", feedbackCounter),
    placementId: placement.id,
    subjectType: "client",
    scheduledFor: addDays(startDate, 7),
    isTrialCheckpoint: true,
    dayOffset: 7,
    attemptCount: 2,
    createdAt: placement.createdAt,
  });
  addCommunication(placement, {
    subjectType: "client",
    summary: "Email requesting feedback, no reply.",
    owner: placement.f5Owner,
    channel: "email",
    outcome: "no_answer",
    createdAt: addDays(TODAY, -4),
  });
  addCommunication(placement, {
    subjectType: "client",
    summary: "Follow-up call, went to voicemail.",
    owner: placement.f5Owner,
    channel: "phone",
    outcome: "no_answer",
    createdAt: addDays(TODAY, -1),
  });
}

// ---------------------------------------------------------------------------
// SCENARIO 4: Repeated lateness (professional attendance concern)
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Redstone Insurance Advisors" });
  const professional = makeProfessional({ fullName: "Carlos Mendoza", role: "Data Entry Specialist" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -55);
  const placement = makePlacement(client, professional, { startDate });
  generateStandardCheckpoints(placement);
  for (let i = 0; i < 4; i += 1) {
    attendanceCounter += 1;
    attendance.push({
      id: uid("attendance", attendanceCounter),
      placementId: placement.id,
      professionalId: professional.id,
      date: addDays(TODAY, -(i * 3 + 2)),
      eventType: "late",
      minutesLate: 15 + i * 5,
      notifiedInAdvance: i % 2 === 0,
      notes: "Cited transportation issues.",
      createdAt: addDays(TODAY, -(i * 3 + 2)),
    });
  }
  issueCounter += 1;
  const issue: Issue = {
    id: uid("issue", issueCounter),
    placementId: placement.id,
    title: "Repeated lateness",
    description: "Four late arrivals in the past two weeks, client has noticed.",
    source: "attendance",
    severity: "medium",
    status: "Investigating",
    owner: placement.f5Owner,
    ownerAssignedAt: addDays(TODAY, -2),
    followupWindows: [],
    recurrenceCount: 0,
    reportedAt: addDays(TODAY, -2),
    reopenedCount: 0,
    createdAt: addDays(TODAY, -2),
  };
  issues.push(issue);
}

// ---------------------------------------------------------------------------
// SCENARIO 5: Full-shift absence without contact (mandatory escalation)
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Meridian Home Services" });
  const professional = makeProfessional({ fullName: "Daniel Osei", role: "Customer Support Specialist" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -80);
  const placement = makePlacement(client, professional, { startDate });
  generateStandardCheckpoints(placement);
  attendanceCounter += 1;
  attendance.push({
    id: uid("attendance", attendanceCounter),
    placementId: placement.id,
    professionalId: professional.id,
    date: addDays(TODAY, -1),
    eventType: "absent_full_shift",
    notifiedInAdvance: false,
    notes: "No call, no show. Client escalated directly to F5 owner.",
    createdAt: addDays(TODAY, -1),
  });
  issueCounter += 1;
  const issue: Issue = {
    id: uid("issue", issueCounter),
    placementId: placement.id,
    title: "Unannounced full-shift absence",
    description: "Professional missed an entire shift with no advance notice or contact.",
    source: "attendance",
    severity: "critical",
    status: "Investigating",
    owner: placement.f5Owner,
    ownerAssignedAt: addDays(TODAY, -1),
    followupWindows: [],
    recurrenceCount: 0,
    reportedAt: addDays(TODAY, -1),
    reopenedCount: 0,
    createdAt: addDays(TODAY, -1),
  };
  issues.push(issue);
  escalationCounter += 1;
  escalations.push({
    id: uid("escalation", escalationCounter),
    placementId: placement.id,
    reason: "full_shift_absence_no_contact",
    status: "open",
    relatedIssueId: issue.id,
    summary: "Full shift missed with zero contact from the professional; client already aware.",
    raisedAt: addHours(`${TODAY}T00:00:00.000Z`, -6),
    createdAt: addHours(`${TODAY}T00:00:00.000Z`, -6),
  });
}

// ---------------------------------------------------------------------------
// SCENARIO 6: Underperformance (coaching in progress)
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Cascade Digital Marketing" });
  const professional = makeProfessional({ fullName: "Elena Petrova", role: "Marketing Coordinator" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -70);
  const placement = makePlacement(client, professional, { startDate });
  generateStandardCheckpoints(placement);
  feedbackCounter += 1;
  feedback.push({
    id: uid("feedback", feedbackCounter),
    placementId: placement.id,
    subjectType: "professional",
    scheduledFor: addDays(TODAY, -10),
    collectedAt: addDays(TODAY, -10) + "T14:00:00.000Z",
    sentiment: "negative",
    summary: "Client reports deliverables consistently missing deadlines and needing rework.",
    attemptCount: 1,
    isTrialCheckpoint: false,
    dayOffset: 60,
    createdAt: addDays(TODAY, -10),
  });
  issueCounter += 1;
  const issue: Issue = {
    id: uid("issue", issueCounter),
    placementId: placement.id,
    title: "Underperformance on deliverable quality and deadlines",
    description: "Two consecutive campaigns delivered late and required significant rework.",
    source: "performance",
    severity: "medium",
    status: "Fix in progress",
    owner: placement.f5Owner,
    ownerAssignedAt: addDays(TODAY, -9),
    fixImplementedAt: undefined,
    followupWindows: [],
    recurrenceCount: 0,
    reportedAt: addDays(TODAY, -10),
    reopenedCount: 0,
    createdAt: addDays(TODAY, -10),
  };
  issues.push(issue);
}

// ---------------------------------------------------------------------------
// SCENARIO 7: Client complaint (negative feedback creates an issue)
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Silverline Financial Group" });
  const professional = makeProfessional({ fullName: "Kevin Alabi", role: "Sales Development Rep" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -18);
  const placement = makePlacement(client, professional, { startDate });
  generateStandardCheckpoints(placement, { skipDayOffsets: [14] });
  feedbackCounter += 1;
  feedback.push({
    id: uid("feedback", feedbackCounter),
    placementId: placement.id,
    subjectType: "client",
    scheduledFor: addDays(startDate, 14),
    collectedAt: addDays(startDate, 14) + "T16:00:00.000Z",
    sentiment: "negative",
    summary: "Client complained the professional is not following the call script and is losing leads.",
    attemptCount: 1,
    isTrialCheckpoint: true,
    dayOffset: 14,
    createdAt: placement.createdAt,
  });
  issueCounter += 1;
  issues.push({
    id: uid("issue", issueCounter),
    placementId: placement.id,
    title: "Client complaint: script adherence and lead handling",
    description: "Client feedback flagged the SDR deviating from the approved call script.",
    source: "client_complaint",
    severity: "high",
    status: "Reported",
    followupWindows: [],
    recurrenceCount: 0,
    reportedAt: addDays(startDate, 14),
    reopenedCount: 0,
    createdAt: addDays(startDate, 14),
  });
}

// ---------------------------------------------------------------------------
// SCENARIO 8: Fix in monitoring (confirm the fix held)
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Oakhaven Consulting" });
  const professional = makeProfessional({ fullName: "Nina Alvarez", role: "HR Coordinator" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -95);
  const placement = makePlacement(client, professional, { startDate });
  generateStandardCheckpoints(placement);
  const fixDate = addDays(TODAY, -2);
  issueCounter += 1;
  const issue: Issue = {
    id: uid("issue", issueCounter),
    placementId: placement.id,
    title: "Onboarding paperwork delays",
    description: "New hire paperwork was being processed 3-4 days late.",
    source: "performance",
    severity: "medium",
    status: "Monitoring",
    owner: placement.f5Owner,
    ownerAssignedAt: addDays(TODAY, -6),
    fixImplementedAt: `${fixDate}T12:00:00.000Z`,
    fixDescription: "Set up a shared checklist and same-day processing SLA.",
    followupWindows: [
      { id: uid("fwin", 1), dueAt: addHours(`${fixDate}T12:00:00.000Z`, 24), windowLabel: "24h", completedAt: addHours(`${fixDate}T12:00:00.000Z`, 24), outcome: "held" },
      { id: uid("fwin", 2), dueAt: addHours(`${fixDate}T12:00:00.000Z`, 72), windowLabel: "3d" },
      { id: uid("fwin", 3), dueAt: addHours(`${fixDate}T12:00:00.000Z`, 168), windowLabel: "7d" },
    ],
    recurrenceCount: 0,
    reportedAt: addDays(TODAY, -6),
    reopenedCount: 0,
    createdAt: addDays(TODAY, -6),
  };
  issues.push(issue);
}

// ---------------------------------------------------------------------------
// SCENARIO 9: Recurring issue during monitoring (auto-escalation)
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Bluepeak Logistics" });
  const professional = makeProfessional({ fullName: "Samuel Otieno", role: "Customer Support Specialist" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -110);
  const placement = makePlacement(client, professional, { startDate });
  generateStandardCheckpoints(placement);
  const fixDate = addDays(TODAY, -5);
  issueCounter += 1;
  const issue: Issue = {
    id: uid("issue", issueCounter),
    placementId: placement.id,
    title: "Response time SLA breaches (recurring)",
    description: "Support ticket response times exceeded SLA; fix applied but recurred during monitoring.",
    source: "performance",
    severity: "high",
    status: "Monitoring",
    owner: placement.f5Owner,
    ownerAssignedAt: addDays(TODAY, -8),
    fixImplementedAt: `${fixDate}T10:00:00.000Z`,
    fixDescription: "Adjusted queue prioritization and added a daily backlog review.",
    followupWindows: [
      { id: uid("fwin", 4), dueAt: addHours(`${fixDate}T10:00:00.000Z`, 24), windowLabel: "24h", completedAt: addHours(`${fixDate}T10:00:00.000Z`, 24), outcome: "held" },
      { id: uid("fwin", 5), dueAt: addHours(`${fixDate}T10:00:00.000Z`, 72), windowLabel: "3d", completedAt: addHours(`${fixDate}T10:00:00.000Z`, 72), outcome: "recurred" },
      { id: uid("fwin", 6), dueAt: addHours(`${fixDate}T10:00:00.000Z`, 168), windowLabel: "7d" },
    ],
    recurrenceCount: 1,
    reportedAt: addDays(TODAY, -8),
    reopenedCount: 0,
    createdAt: addDays(TODAY, -8),
  };
  issues.push(issue);
  escalationCounter += 1;
  escalations.push({
    id: uid("escalation", escalationCounter),
    placementId: placement.id,
    reason: "recurrence_during_monitoring",
    status: "open",
    relatedIssueId: issue.id,
    summary: "SLA breach recurred during the monitoring window after a fix was implemented.",
    raisedAt: addHours(`${fixDate}T10:00:00.000Z`, 72),
    createdAt: addHours(`${fixDate}T10:00:00.000Z`, 72),
  });
}

// ---------------------------------------------------------------------------
// SCENARIO 10: Replacement request (mandatory escalation)
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Sunridge Hospitality Group" });
  const professional = makeProfessional({ fullName: "Wendy Castillo", role: "Executive Assistant" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -40);
  const placement = makePlacement(client, professional, { startDate });
  generateStandardCheckpoints(placement);
  feedbackCounter += 1;
  feedback.push({
    id: uid("feedback", feedbackCounter),
    placementId: placement.id,
    subjectType: "client",
    scheduledFor: addDays(TODAY, -3),
    collectedAt: addDays(TODAY, -3) + "T13:00:00.000Z",
    sentiment: "negative",
    summary: "Client stated this is 'not a good fit' and asked what replacement options look like.",
    attemptCount: 1,
    isTrialCheckpoint: false,
    dayOffset: 60,
    createdAt: addDays(TODAY, -3),
  });
  escalationCounter += 1;
  escalations.push({
    id: uid("escalation", escalationCounter),
    placementId: placement.id,
    reason: "cancellation_or_replacement_mentioned",
    status: "open",
    summary: "Client explicitly asked about replacement options during the day-60 check-in.",
    raisedAt: addDays(TODAY, -3) + "T13:30:00.000Z",
    createdAt: addDays(TODAY, -3) + "T13:30:00.000Z",
  });
}

// ---------------------------------------------------------------------------
// SCENARIO 11: Security / confidentiality escalation
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Fairmont Financial Advisors" });
  const professional = makeProfessional({ fullName: "Victor Nkemelu", role: "Bookkeeper" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -25);
  const placement = makePlacement(client, professional, { startDate });
  generateStandardCheckpoints(placement);
  issueCounter += 1;
  const issue: Issue = {
    id: uid("issue", issueCounter),
    placementId: placement.id,
    title: "Client data shared over unsecured personal email",
    description: "Professional forwarded client financial statements to a personal email account.",
    source: "internal",
    severity: "critical",
    status: "Investigating",
    owner: "Morgan Ellis",
    ownerAssignedAt: addHours(`${TODAY}T00:00:00.000Z`, -3),
    followupWindows: [],
    recurrenceCount: 0,
    reportedAt: addHours(`${TODAY}T00:00:00.000Z`, -3),
    reopenedCount: 0,
    createdAt: addHours(`${TODAY}T00:00:00.000Z`, -3),
  };
  issues.push(issue);
  escalationCounter += 1;
  escalations.push({
    id: uid("escalation", escalationCounter),
    placementId: placement.id,
    reason: "security_confidentiality_harassment_compliance_payroll_safety",
    status: "open",
    relatedIssueId: issue.id,
    summary: "Confidential client financial data was sent to a personal, unsecured email account.",
    raisedAt: addHours(`${TODAY}T00:00:00.000Z`, -3),
    escalatedTo: "Compliance / Senior Leadership",
    createdAt: addHours(`${TODAY}T00:00:00.000Z`, -3),
  });
}

// ---------------------------------------------------------------------------
// SCENARIO 12: Routine month-six check-in (healthy, long-running)
// ---------------------------------------------------------------------------
{
  const client = makeClient({ companyName: "Pinecrest Educational Technology" });
  const professional = makeProfessional({ fullName: "Angela Fox", role: "Software Developer" });
  clients.push(client);
  professionals.push(professional);
  const startDate = addDays(TODAY, -184);
  const placement = makePlacement(client, professional, {
    startDate,
    initialNotes: "Long-running, consistently healthy placement.",
  });
  generateStandardCheckpoints(placement);
  addCommunication(placement, {
    subjectType: "client",
    summary: "Month-six check-in: client extremely satisfied, discussing a second placement.",
    owner: placement.f5Owner,
    channel: "video",
    sentiment: "positive",
    createdAt: addDays(TODAY, -3),
  });
}

// ---------------------------------------------------------------------------
// Bulk-generate additional placements to reach target volume.
// Target: ~18 clients, ~40 professionals, 36 active + 4 historical placements.
// 12 scenario placements already created above (all active, non-historical).
// ---------------------------------------------------------------------------
const TARGET_ACTIVE_TOTAL = 36;
const TARGET_HISTORICAL = 4;
const TARGET_CLIENTS = 18;
const TARGET_PROFESSIONALS = 40;

const remainingActive = TARGET_ACTIVE_TOTAL - placements.length;

// Some bulk placements reuse existing clients (multi-placement clients),
// most get fresh clients up to the target count.
function getOrCreateClient(): Client {
  if (clients.length < TARGET_CLIENTS && rand() < 0.7) {
    const c = makeClient();
    clients.push(c);
    return c;
  }
  return pick(clients);
}

for (let i = 0; i < remainingActive; i += 1) {
  const client = getOrCreateClient();
  const professional = makeProfessional();
  professionals.push(professional);
  const startDate = addDays(TODAY, -randInt(1, 250));
  const placement = makePlacement(client, professional, { startDate });
  generateStandardCheckpoints(placement);

  // Sprinkle in a routine attendance record and communication for texture.
  if (rand() < 0.6) {
    attendanceCounter += 1;
    attendance.push({
      id: uid("attendance", attendanceCounter),
      placementId: placement.id,
      professionalId: professional.id,
      date: addDays(TODAY, -randInt(1, 20)),
      eventType: "on_time",
      notifiedInAdvance: true,
      createdAt: addDays(TODAY, -randInt(1, 20)),
    });
  }
  if (rand() < 0.7) {
    addCommunication(placement, {
      subjectType: pick(["client", "professional"] as const),
      summary: pick([
        "Routine check-in, no concerns raised.",
        "Confirmed schedule for the upcoming week.",
        "Shared positive feedback from the team.",
        "Answered a question about time-off request process.",
      ]),
      owner: placement.f5Owner,
      channel: pick(["email", "phone", "slack"] as const),
      sentiment: "positive",
    });
  }
}

// Top up professionals to target count with unassigned (bench) professionals.
while (professionals.length < TARGET_PROFESSIONALS) {
  professionals.push(makeProfessional());
}

// Historical (ended) placements.
for (let i = 0; i < TARGET_HISTORICAL; i += 1) {
  const client = pick(clients);
  const professional = makeProfessional();
  professionals.push(professional);
  const startDate = addDays(TODAY, -randInt(200, 500));
  const endedAt = addDays(startDate, randInt(60, 180));
  const placement = makePlacement(client, professional, {
    startDate,
    status: "Ended",
    endedAt,
    endReason: pick([
      "Engagement completed successfully",
      "Client reduced headcount",
      "Professional accepted another placement",
      "Replaced after trial mismatch",
    ]),
  });
  generateStandardCheckpoints(placement);
}

// Extra bench (unassigned) professionals beyond target so the wizard has a
// realistic pool of "existing unassigned professional" options.
for (let i = 0; i < 6; i += 1) {
  professionals.push(makeProfessional());
}

// A couple of extra open/closed issues and standalone follow-ups scattered
// across random existing placements to push issue/followup/communication
// volume toward the plan's targets without hand-authoring each one.
const activePlacements = placements.filter((p) => p.status === "Active");
while (issues.length < 32) {
  const placement = pick(activePlacements);
  issueCounter += 1;
  const severity = pick(["low", "medium", "high"] as const);
  const status = pick(["Reported", "Investigating", "Closed", "Closed"] as const);
  const reportedAt = addDays(TODAY, -randInt(1, 60));
  issues.push({
    id: uid("issue", issueCounter),
    placementId: placement.id,
    title: pick([
      "Minor communication delay",
      "Client requested schedule adjustment",
      "Software access issue resolved",
      "Brief tooling outage on client side",
      "Clarified reporting format with client",
    ]),
    description: "Routine item logged and resolved without escalation.",
    source: pick(["internal", "performance", "client_complaint"] as const),
    severity,
    status,
    owner: placement.f5Owner,
    ownerAssignedAt: reportedAt,
    followupWindows: [],
    recurrenceCount: 0,
    reportedAt,
    ...(status === "Closed" ? { closedAt: addDays(reportedAt, randInt(1, 5)) } : {}),
    reopenedCount: 0,
    createdAt: reportedAt,
  });
}

while (followups.length < 20) {
  const placement = pick(activePlacements);
  followupCounter += 1;
  const dueDate = addDays(TODAY, randInt(-5, 10));
  followups.push({
    id: uid("followup", followupCounter),
    placementId: placement.id,
    dueDate,
    description: pick([
      "Confirm client received the revised schedule.",
      "Check in on new tooling access.",
      "Follow up on outstanding invoice question.",
      "Verify onboarding checklist completion.",
    ]),
    owner: placement.f5Owner,
    ...(dueDate < TODAY ? { completedAt: addDays(dueDate, 1), outcome: "Completed on time." } : {}),
    createdAt: addDays(dueDate, -7),
  });
}

while (communications.length < 150) {
  const placement = pick(activePlacements);
  addCommunication(placement, {
    subjectType: pick(["client", "professional"] as const),
    summary: pick([
      "Routine status update shared.",
      "Confirmed upcoming holiday schedule.",
      "Answered question about timesheet process.",
      "Shared positive shoutout from the team.",
      "Coordinated a schedule swap.",
    ]),
    owner: placement.f5Owner,
    channel: pick(["email", "phone", "slack", "video"] as const),
    sentiment: pick(["positive", "neutral"] as const),
    createdAt: addDays(TODAY, -randInt(1, 90)),
  });
}

while (attendance.length < 200) {
  const placement = pick(activePlacements);
  attendanceCounter += 1;
  attendance.push({
    id: uid("attendance", attendanceCounter),
    placementId: placement.id,
    professionalId: placement.professionalId,
    date: addDays(TODAY, -randInt(1, 90)),
    eventType: pick(["on_time", "on_time", "on_time", "late"] as const),
    notifiedInAdvance: true,
    createdAt: addDays(TODAY, -randInt(1, 90)),
  });
}

while (feedback.length < 110) {
  const placement = pick(activePlacements);
  const scheduledFor = addDays(TODAY, -randInt(1, 60));
  feedbackCounter += 1;
  feedback.push({
    id: uid("feedback", feedbackCounter),
    placementId: placement.id,
    subjectType: pick(["client", "professional"] as const),
    scheduledFor,
    collectedAt: `${scheduledFor}T14:00:00.000Z`,
    sentiment: pick(["positive", "positive", "neutral"] as const),
    summary: "Routine checkpoint, no concerns.",
    attemptCount: 1,
    isTrialCheckpoint: false,
    dayOffset: 60,
    createdAt: scheduledFor,
  });
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------
const outDir = join(__dirname, "..", "src", "data", "seed");
mkdirSync(outDir, { recursive: true });

function write(name: string, data: unknown) {
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(data, null, 2) + "\n", "utf-8");
}

write("clients", clients);
write("professionals", professionals);
write("placements", placements);
write("feedback", feedback);
write("attendance", attendance);
write("checkins", checkins);
write("issues", issues);
write("followups", followups);
write("communications", communications);
write("escalations", escalations);
write("auditLog", auditLog);

console.log("Seed data generated:");
console.log({
  clients: clients.length,
  professionals: professionals.length,
  placements: placements.length,
  active: placements.filter((p) => p.status === "Active").length,
  ended: placements.filter((p) => p.status === "Ended").length,
  feedback: feedback.length,
  attendance: attendance.length,
  checkins: checkins.length,
  issues: issues.length,
  followups: followups.length,
  communications: communications.length,
  escalations: escalations.length,
  auditLog: auditLog.length,
});
