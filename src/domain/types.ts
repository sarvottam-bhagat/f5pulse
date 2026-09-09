// Core domain types for F5 Pulse.
// Dates are ISO 8601 strings (YYYY-MM-DD or full timestamps) so they survive
// JSON <-> localStorage round-trips without a revive step.

export type ID = string;

export type USTimeZone =
  | "America/New_York"
  | "America/Chicago"
  | "America/Denver"
  | "America/Phoenix"
  | "America/Los_Angeles"
  | "America/Anchorage"
  | "Pacific/Honolulu";

export type PreferredChannel = "email" | "phone" | "slack" | "video";

export interface Client {
  id: ID;
  companyName: string;
  industry: string;
  primaryContactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  usTimeZone: USTimeZone;
  preferredChannel: PreferredChannel;
  notes: string;
  archived: boolean;
  createdAt: string;
}

export type ProfessionalRole =
  | "Customer Support Specialist"
  | "Executive Assistant"
  | "Bookkeeper"
  | "Software Developer"
  | "Data Entry Specialist"
  | "Sales Development Rep"
  | "Marketing Coordinator"
  | "HR Coordinator"
  | "Recruiter"
  | "Graphic Designer";

export interface WorkingHours {
  start: string; // "09:00"
  end: string; // "17:00"
  timeZone: string; // IANA tz of the professional
}

export interface Professional {
  id: ID;
  fullName: string;
  role: ProfessionalRole;
  email: string;
  phone: string;
  country: string;
  timeZone: string;
  workingHours: WorkingHours;
  f5Manager: string;
  notes: string;
  archived: boolean;
  createdAt: string;
}

export type PlacementStatus = "Upcoming" | "Active" | "Ended";

export interface Placement {
  id: ID;
  clientId: ID;
  professionalId: ID;
  roleTitle: string;
  startDate: string; // YYYY-MM-DD
  trialEndDate: string; // YYYY-MM-DD, real per-placement trial end
  f5Owner: string;
  expectedSchedule: string; // free text e.g. "Mon-Fri 9-5 EST"
  initialNotes: string;
  status: PlacementStatus;
  archived: boolean;
  createdAt: string;
  endedAt?: string;
  endReason?: string;
}

export type FeedbackSubjectType = "client" | "professional";
export type Sentiment = "positive" | "neutral" | "negative";

export interface FeedbackRecord {
  id: ID;
  placementId: ID;
  subjectType: FeedbackSubjectType;
  scheduledFor: string; // YYYY-MM-DD, the checkpoint due date
  collectedAt?: string; // when actually collected, if it was
  sentiment?: Sentiment;
  summary?: string;
  attemptCount: number; // number of contact attempts made toward this checkpoint
  isTrialCheckpoint: boolean;
  dayOffset: number; // e.g. 2, 7, 14, 21, 30 for trial; 30/60/90... for post-trial
  createdAt: string;
}

export type AttendanceEventType =
  | "on_time"
  | "late"
  | "absent_full_shift"
  | "absent_partial"
  | "early_departure";

export interface AttendanceRecord {
  id: ID;
  placementId: ID;
  professionalId: ID;
  date: string; // YYYY-MM-DD
  eventType: AttendanceEventType;
  minutesLate?: number;
  notifiedInAdvance: boolean;
  notes?: string;
  createdAt: string;
}

export type CheckinSubjectType = "client" | "professional";
export type CheckinStatus = "scheduled" | "completed" | "overdue" | "skipped";

export interface CheckinRecord {
  id: ID;
  placementId: ID;
  subjectType: CheckinSubjectType;
  dueDate: string; // YYYY-MM-DD
  completedAt?: string;
  status: CheckinStatus;
  isTrialCheckpoint: boolean;
  dayOffset: number;
  notes?: string;
  createdAt: string;
}

export type IssueStatus =
  | "Reported"
  | "Investigating"
  | "Fix in progress"
  | "Monitoring"
  | "Closed";

export type IssueSeverity = "low" | "medium" | "high" | "critical";

export type IssueSource = "client_complaint" | "attendance" | "performance" | "internal" | "feedback_negative";

export interface IssueFollowupWindow {
  id: ID;
  dueAt: string; // ISO timestamp, e.g. +24h/+3d/+7d after fix
  windowLabel: "24h" | "3d" | "7d";
  completedAt?: string;
  outcome?: "held" | "recurred";
}

export interface Issue {
  id: ID;
  placementId: ID;
  title: string;
  description: string;
  source: IssueSource;
  severity: IssueSeverity;
  status: IssueStatus;
  owner?: string;
  ownerAssignedAt?: string;
  fixImplementedAt?: string;
  fixDescription?: string;
  followupWindows: IssueFollowupWindow[];
  recurrenceCount: number;
  reportedAt: string;
  closedAt?: string;
  reopenedCount: number;
  createdAt: string;
}

export interface Followup {
  id: ID;
  placementId: ID;
  relatedIssueId?: ID;
  dueDate: string; // YYYY-MM-DD
  description: string;
  owner: string;
  completedAt?: string;
  outcome?: string;
  createdAt: string;
}

export type CommunicationChannel = "email" | "phone" | "slack" | "video" | "sms";
export type CommunicationDirection = "outbound" | "inbound";
export type ContactOutcome = "reached" | "no_answer";

export interface Communication {
  id: ID;
  placementId: ID;
  subjectType: FeedbackSubjectType;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  outcome?: ContactOutcome;
  sentiment?: Sentiment;
  summary: string;
  commitment?: string;
  owner: string;
  nextFollowUpDate?: string;
  draftBody?: string;
  markedSentAt?: string;
  createdAt: string;
}

export type EscalationReason =
  | "cancellation_or_replacement_mentioned"
  | "security_confidentiality_harassment_compliance_payroll_safety"
  | "full_shift_absence_no_contact"
  | "high_severity_no_owner_4h"
  | "critical_no_fix_24h"
  | "recurrence_during_monitoring"
  | "trial_feedback_red";

export type EscalationStatus = "open" | "acknowledged" | "resolved";

export interface Escalation {
  id: ID;
  placementId: ID;
  reason: EscalationReason;
  status: EscalationStatus;
  relatedIssueId?: ID;
  summary: string;
  raisedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  raisedBy?: string;
  escalatedTo?: string;
  createdAt: string;
}

export interface AuditEntry {
  id: ID;
  placementId: ID;
  action: string;
  detail: string;
  actor: string;
  at: string;
}

export type HealthState = "Healthy" | "Watch" | "At Risk" | "Critical";

export interface HealthAssessment {
  state: HealthState;
  reasons: string[];
}

export interface Seed {
  clients: Client[];
  professionals: Professional[];
  placements: Placement[];
  feedback: FeedbackRecord[];
  attendance: AttendanceRecord[];
  checkins: CheckinRecord[];
  issues: Issue[];
  followups: Followup[];
  communications: Communication[];
  escalations: Escalation[];
  auditLog: AuditEntry[];
}
