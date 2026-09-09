import type {
  Client,
  Professional,
  Placement,
  ContactOutcome,
  Sentiment,
  FeedbackSubjectType,
  CommunicationChannel,
  IssueSeverity,
  IssueSource,
  EscalationReason,
} from "../domain/types";

export type StoreResult<T> = { ok: true; value: T } | { ok: false; error: string };

export interface NewClientInput {
  companyName: string;
  industry: string;
  primaryContactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  usTimeZone: Client["usTimeZone"];
  preferredChannel: Client["preferredChannel"];
  notes?: string;
}

export interface NewProfessionalInput {
  fullName: string;
  role: Professional["role"];
  email: string;
  phone: string;
  country: string;
  timeZone: string;
  workingHours: Professional["workingHours"];
  f5Manager: string;
  notes?: string;
}

export interface NewPlacementInput {
  roleTitle: string;
  startDate: string;
  trialEndDate: string;
  f5Owner: string;
  expectedSchedule: string;
  initialNotes?: string;
  status: "Upcoming" | "Active";
}

export interface CreatePlacementBundleInput {
  client: { mode: "existing"; clientId: string } | { mode: "new"; data: NewClientInput };
  professional: { mode: "existing"; professionalId: string } | { mode: "new"; data: NewProfessionalInput };
  placement: NewPlacementInput;
}

export interface CreatePlacementBundleResult {
  placement: Placement;
  client: Client;
  professional: Professional;
  firstClientContactDate: string;
  firstProfessionalCheckinDate: string;
}

export interface LogCommunicationInput {
  placementId: string;
  subjectType: FeedbackSubjectType;
  channel: CommunicationChannel;
  direction: "outbound" | "inbound";
  outcome?: ContactOutcome;
  sentiment?: Sentiment;
  summary: string;
  commitment?: string;
  owner: string;
  nextFollowUpDate?: string;
  draftBody?: string;
}

export interface LogOutcomeInput {
  placementId: string;
  subjectType: FeedbackSubjectType;
  outcome: ContactOutcome;
  sentiment?: Sentiment;
  summary: string;
  commitment?: string;
  owner: string;
  nextFollowUpDate?: string;
  createIssue: boolean;
  escalate: boolean;
}

export interface RecordFeedbackInput {
  placementId: string;
  feedbackId?: string; // if provided, fills an existing scheduled checkpoint
  subjectType: FeedbackSubjectType;
  sentiment: Sentiment;
  summary: string;
  collectedAt: string;
}

export interface RecordAttendanceInput {
  placementId: string;
  professionalId: string;
  date: string;
  eventType: "on_time" | "late" | "absent_full_shift" | "absent_partial" | "early_departure";
  minutesLate?: number;
  notifiedInAdvance: boolean;
  notes?: string;
}

export interface CreateIssueInput {
  placementId: string;
  title: string;
  description: string;
  source: IssueSource;
  severity: IssueSeverity;
  owner?: string;
}

export interface ImplementFixInput {
  issueId: string;
  fixDescription: string;
  at: string;
}

export interface ConfirmFollowupWindowInput {
  issueId: string;
  windowId: string;
  outcome: "held" | "recurred";
  at: string;
}

export interface CompleteFollowupInput {
  followupId: string;
  outcome: string;
  completedAt: string;
}

export interface CreateEscalationInput {
  placementId: string;
  reason: EscalationReason;
  summary: string;
  relatedIssueId?: string;
  raisedBy?: string;
  escalatedTo?: string;
  nextFollowUpDate?: string;
}
