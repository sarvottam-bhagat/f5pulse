// Proposed actions the AI can suggest in Chat. The AI never writes data
// directly — every proposal must be reviewed and confirmed by the operator,
// which then calls the same store mutation methods used elsewhere in the
// app (Home action sheets, detail-page actions).

export type ProposedActionKind =
  | "log_contact"
  | "record_feedback"
  | "create_issue"
  | "schedule_followup"
  | "mark_fix_implemented"
  | "create_escalation"
  | "start_replacement_review";

export interface ProposedActionBase {
  id: string;
  kind: ProposedActionKind;
  label: string;
  placementId: string;
}

export interface LogContactProposal extends ProposedActionBase {
  kind: "log_contact";
  subjectType: "client" | "professional";
  summary: string;
  channel: "email" | "phone" | "slack" | "video";
}

export interface RecordFeedbackProposal extends ProposedActionBase {
  kind: "record_feedback";
  subjectType: "client" | "professional";
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
}

export interface CreateIssueProposal extends ProposedActionBase {
  kind: "create_issue";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface ScheduleFollowupProposal extends ProposedActionBase {
  kind: "schedule_followup";
  dueDate: string;
  description: string;
}

export interface MarkFixImplementedProposal extends ProposedActionBase {
  kind: "mark_fix_implemented";
  issueId: string;
  fixDescription: string;
}

export interface CreateEscalationProposal extends ProposedActionBase {
  kind: "create_escalation";
  reason: string;
  summary: string;
}

export interface StartReplacementReviewProposal extends ProposedActionBase {
  kind: "start_replacement_review";
  summary: string;
}

export type ProposedAction =
  | LogContactProposal
  | RecordFeedbackProposal
  | CreateIssueProposal
  | ScheduleFollowupProposal
  | MarkFixImplementedProposal
  | CreateEscalationProposal
  | StartReplacementReviewProposal;
