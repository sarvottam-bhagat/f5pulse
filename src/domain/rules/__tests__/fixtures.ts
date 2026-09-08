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
} from "../../types";
import type { PlacementContext } from "../context";

export const TODAY = "2026-09-08";

export function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: "client_1",
    companyName: "Test Co",
    industry: "SaaS",
    primaryContactName: "Jane Doe",
    contactTitle: "COO",
    email: "jane@testco.com",
    phone: "+1-555-555-5555",
    usTimeZone: "America/New_York",
    preferredChannel: "email",
    notes: "",
    archived: false,
    createdAt: "2026-01-01",
    ...overrides,
  };
}

export function makeProfessional(overrides: Partial<Professional> = {}): Professional {
  return {
    id: "pro_1",
    fullName: "Alex Rivera",
    role: "Customer Support Specialist",
    email: "alex@f5talent.example",
    phone: "+63-555-5555",
    country: "Philippines",
    timeZone: "Asia/Manila",
    workingHours: { start: "09:00", end: "17:00", timeZone: "Asia/Manila" },
    f5Manager: "Jamie Ortiz",
    notes: "",
    archived: false,
    createdAt: "2026-01-01",
    ...overrides,
  };
}

export function makePlacement(overrides: Partial<Placement> = {}): Placement {
  return {
    id: "placement_1",
    clientId: "client_1",
    professionalId: "pro_1",
    roleTitle: "Customer Support Specialist",
    startDate: "2026-08-01",
    trialEndDate: "2026-08-31",
    f5Owner: "Jamie Ortiz",
    expectedSchedule: "Mon-Fri, 9-5 EST",
    initialNotes: "",
    status: "Active",
    archived: false,
    createdAt: "2026-08-01",
    ...overrides,
  };
}

export function makeContext(overrides: {
  client?: Partial<Client>;
  professional?: Partial<Professional>;
  placement?: Partial<Placement>;
  feedback?: FeedbackRecord[];
  attendance?: AttendanceRecord[];
  checkins?: CheckinRecord[];
  issues?: Issue[];
  followups?: Followup[];
  communications?: Communication[];
  escalations?: Escalation[];
} = {}): PlacementContext {
  return {
    client: makeClient(overrides.client),
    professional: makeProfessional(overrides.professional),
    placement: makePlacement(overrides.placement),
    feedback: overrides.feedback ?? [],
    attendance: overrides.attendance ?? [],
    checkins: overrides.checkins ?? [],
    issues: overrides.issues ?? [],
    followups: overrides.followups ?? [],
    communications: overrides.communications ?? [],
    escalations: overrides.escalations ?? [],
  };
}

export function makeFeedback(overrides: Partial<FeedbackRecord> = {}): FeedbackRecord {
  return {
    id: "feedback_1",
    placementId: "placement_1",
    subjectType: "client",
    scheduledFor: "2026-08-08",
    isTrialCheckpoint: true,
    dayOffset: 7,
    attemptCount: 0,
    createdAt: "2026-08-01",
    ...overrides,
  };
}

export function makeIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: "issue_1",
    placementId: "placement_1",
    title: "Test issue",
    description: "A test issue.",
    source: "internal",
    severity: "medium",
    status: "Reported",
    followupWindows: [],
    recurrenceCount: 0,
    reportedAt: "2026-09-01",
    reopenedCount: 0,
    createdAt: "2026-09-01",
    ...overrides,
  };
}

export function makeCheckin(overrides: Partial<CheckinRecord> = {}): CheckinRecord {
  return {
    id: "checkin_1",
    placementId: "placement_1",
    subjectType: "professional",
    dueDate: "2026-08-04",
    isTrialCheckpoint: true,
    dayOffset: 3,
    status: "scheduled",
    createdAt: "2026-08-01",
    ...overrides,
  };
}

export function makeAttendance(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: "attendance_1",
    placementId: "placement_1",
    professionalId: "pro_1",
    date: "2026-09-01",
    eventType: "late",
    notifiedInAdvance: false,
    createdAt: "2026-09-01",
    ...overrides,
  };
}

export function makeEscalation(overrides: Partial<Escalation> = {}): Escalation {
  return {
    id: "escalation_1",
    placementId: "placement_1",
    reason: "cancellation_or_replacement_mentioned",
    status: "open",
    summary: "Test escalation",
    raisedAt: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}
