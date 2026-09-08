// Placement health state: applies the HIGHEST matching state among
// Critical > At Risk > Watch > Healthy, and always returns the exact
// reasons contributing to that state.

import type { HealthAssessment, HealthState } from "../types";
import type { PlacementContext } from "./context";
import { assessSilence } from "./silence";
import { detectMandatoryEscalations } from "./escalation";
import { dueFollowupWindows } from "./issueLifecycle";

export function assessHealth(ctx: PlacementContext, asOf: string): HealthAssessment {
  const reasons: string[] = [];
  let state: HealthState = "Healthy";

  function upgrade(candidate: HealthState) {
    const order: HealthState[] = ["Healthy", "Watch", "At Risk", "Critical"];
    if (order.indexOf(candidate) > order.indexOf(state)) {
      state = candidate;
    }
  }

  // --- Critical: any open mandatory escalation ---
  const openEscalations = ctx.escalations.filter((e) => e.status !== "resolved");
  const mandatoryTriggers = detectMandatoryEscalations(ctx, asOf);
  if (openEscalations.length > 0) {
    upgrade("Critical");
    for (const e of openEscalations) {
      reasons.push(`Open escalation: ${e.summary}`);
    }
  }
  if (mandatoryTriggers.length > 0) {
    upgrade("Critical");
    for (const t of mandatoryTriggers) {
      reasons.push(`Mandatory escalation condition: ${t.detail}`);
    }
  }

  // --- At Risk: serious unresolved issue, negative feedback, or red silence ---
  const seriousUnresolvedIssue = ctx.issues.find(
    (i) => i.status !== "Closed" && (i.severity === "high" || i.severity === "critical"),
  );
  if (seriousUnresolvedIssue) {
    upgrade("At Risk");
    reasons.push(
      `Unresolved ${seriousUnresolvedIssue.severity}-severity issue: "${seriousUnresolvedIssue.title}" (${seriousUnresolvedIssue.status})`,
    );
  }

  const recentNegativeFeedback = ctx.feedback.find((f) => f.sentiment === "negative");
  if (recentNegativeFeedback) {
    upgrade("At Risk");
    reasons.push(
      `Negative ${recentNegativeFeedback.subjectType} feedback recorded${recentNegativeFeedback.summary ? `: "${recentNegativeFeedback.summary}"` : ""}`,
    );
  }

  const silence = assessSilence(ctx, asOf);
  if (silence.level === "at_risk") {
    upgrade("At Risk");
    reasons.push(`Client silence at red/at-risk level${silence.reason ? `: ${silence.reason}` : ""}`);
  }

  // --- Watch: overdue checkpoint, attendance concern, or monitoring ---
  if (silence.level === "watch") {
    upgrade("Watch");
    reasons.push(`Client silence at watch level${silence.reason ? `: ${silence.reason}` : ""}`);
  }

  const overdueProfessionalCheckins = ctx.checkins.filter(
    (c) => c.subjectType === "professional" && c.status !== "completed" && c.dueDate <= asOf,
  );
  if (overdueProfessionalCheckins.length > 0) {
    upgrade("Watch");
    for (const c of overdueProfessionalCheckins) {
      reasons.push(`Professional check-in overdue (was due ${c.dueDate})`);
    }
  }

  const attendanceConcern = ctx.attendance.filter(
    (a) => a.eventType === "late" || a.eventType === "absent_partial" || a.eventType === "early_departure",
  );
  if (attendanceConcern.length >= 2) {
    upgrade("Watch");
    reasons.push(`${attendanceConcern.length} attendance concerns on record (lateness/partial absence)`);
  }

  const monitoringIssues = ctx.issues.filter((i) => i.status === "Monitoring");
  if (monitoringIssues.length > 0) {
    upgrade("Watch");
    for (const i of monitoringIssues) {
      const due = dueFollowupWindows(i, asOf);
      reasons.push(
        `Issue "${i.title}" in monitoring${due.length > 0 ? ` (${due.length} follow-up confirmation${due.length === 1 ? "" : "s"} due)` : ""}`,
      );
    }
  }

  const anyUnresolvedIssue = ctx.issues.find((i) => i.status !== "Closed" && i.severity !== "high" && i.severity !== "critical");
  if (anyUnresolvedIssue && state === "Healthy") {
    upgrade("Watch");
    reasons.push(`Open issue: "${anyUnresolvedIssue.title}" (${anyUnresolvedIssue.status})`);
  }

  if (state === "Healthy") {
    reasons.push("No overdue checkpoints, unresolved issues, or negative signals.");
  }

  return { state, reasons };
}
