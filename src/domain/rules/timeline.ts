// Merges every event type related to a placement into one chronological
// timeline for the Placement detail page: start/trial-end, client feedback,
// professional check-ins, attendance exceptions, issues, fixes, follow-ups,
// communications, and escalations.

import type { PlacementContext } from "./context";

export type TimelineEventType =
  | "placement_start"
  | "trial_end"
  | "feedback"
  | "checkin"
  | "attendance"
  | "issue_reported"
  | "issue_status"
  | "fix_implemented"
  | "followup"
  | "communication"
  | "escalation";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  at: string; // ISO date or datetime, used for sorting
  title: string;
  detail?: string;
  tone: "neutral" | "positive" | "warning" | "critical";
}

export function buildPlacementTimeline(ctx: PlacementContext): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    id: `${ctx.placement.id}_start`,
    type: "placement_start",
    at: ctx.placement.startDate,
    title: "Placement started",
    detail: ctx.placement.roleTitle,
    tone: "neutral",
  });
  events.push({
    id: `${ctx.placement.id}_trial_end`,
    type: "trial_end",
    at: ctx.placement.trialEndDate,
    title: "Trial period ends",
    tone: "neutral",
  });

  for (const f of ctx.feedback) {
    if (f.collectedAt) {
      events.push({
        id: f.id,
        type: "feedback",
        at: f.collectedAt,
        title: `${f.subjectType === "client" ? "Client" : "Professional"} feedback collected`,
        detail: f.summary,
        tone: f.sentiment === "negative" ? "critical" : f.sentiment === "positive" ? "positive" : "neutral",
      });
    }
  }

  for (const c of ctx.checkins) {
    if (c.completedAt) {
      events.push({
        id: c.id,
        type: "checkin",
        at: c.completedAt,
        title: `${c.subjectType === "client" ? "Client" : "Professional"} check-in completed`,
        detail: c.notes,
        tone: "neutral",
      });
    }
  }

  for (const a of ctx.attendance) {
    events.push({
      id: a.id,
      type: "attendance",
      at: a.date,
      title: `Attendance: ${a.eventType.replace(/_/g, " ")}`,
      detail: a.notes,
      tone: a.eventType === "on_time" ? "positive" : a.eventType === "absent_full_shift" ? "critical" : "warning",
    });
  }

  for (const issue of ctx.issues) {
    events.push({
      id: `${issue.id}_reported`,
      type: "issue_reported",
      at: issue.reportedAt,
      title: `Issue reported: ${issue.title}`,
      detail: issue.description,
      tone: issue.severity === "critical" || issue.severity === "high" ? "critical" : "warning",
    });
    if (issue.fixImplementedAt) {
      events.push({
        id: `${issue.id}_fix`,
        type: "fix_implemented",
        at: issue.fixImplementedAt,
        title: `Fix implemented: ${issue.title}`,
        detail: issue.fixDescription,
        tone: "positive",
      });
    }
    if (issue.closedAt) {
      events.push({
        id: `${issue.id}_closed`,
        type: "issue_status",
        at: issue.closedAt,
        title: `Issue closed: ${issue.title}`,
        tone: "positive",
      });
    }
  }

  for (const f of ctx.followups) {
    events.push({
      id: f.id,
      type: "followup",
      at: f.completedAt ?? f.dueDate,
      title: f.completedAt ? `Follow-up completed: ${f.description}` : `Follow-up due: ${f.description}`,
      detail: f.outcome,
      tone: f.completedAt ? "positive" : "neutral",
    });
  }

  for (const c of ctx.communications) {
    events.push({
      id: c.id,
      type: "communication",
      at: c.createdAt,
      title: `${c.channel} · ${c.direction === "outbound" ? "Outbound" : "Inbound"}`,
      detail: c.summary,
      tone: c.sentiment === "negative" ? "warning" : "neutral",
    });
  }

  for (const e of ctx.escalations) {
    events.push({
      id: e.id,
      type: "escalation",
      at: e.raisedAt,
      title: "Escalation raised",
      detail: `${e.raisedBy && e.escalatedTo ? `Raised by ${e.raisedBy} to ${e.escalatedTo}. ` : ""}${e.summary}`,
      tone: "critical",
    });
  }

  return events.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
