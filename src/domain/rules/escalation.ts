// Mandatory escalation triggers, evaluated against a placement context.
// These are advisory detections used by the health/priority engines; the
// actual Escalation records are created via store mutations (Task 4), but
// the *conditions* for "should this be escalated" live here so Home,
// Placement detail, and Chat can all agree on when to prompt for one.

import { daysBetween } from "../dates";
import { ESCALATION_SLA } from "../cadence";
import type { EscalationReason } from "../types";
import type { PlacementContext } from "./context";
import { assessSilence } from "./silence";

export interface EscalationTrigger {
  reason: EscalationReason;
  detail: string;
}

function hoursBetween(fromISO: string, toISO: string): number {
  return (new Date(toISO).getTime() - new Date(fromISO).getTime()) / (1000 * 60 * 60);
}

/**
 * Returns every mandatory-escalation condition currently true for this
 * placement, that does not already have an open escalation recorded for
 * the same reason (so we don't nag about something already escalated).
 */
export function detectMandatoryEscalations(ctx: PlacementContext, asOf: string): EscalationTrigger[] {
  const triggers: EscalationTrigger[] = [];
  const alreadyOpenReasons = new Set(
    ctx.escalations.filter((e) => e.status !== "resolved").map((e) => e.reason),
  );

  // Client mentions cancellation or replacement — detected via negative
  // feedback summaries mentioning those terms (best-effort heuristic).
  const mentionsReplacement = ctx.feedback.some(
    (f) =>
      f.sentiment === "negative" &&
      f.summary &&
      /cancel|replace|not a good fit|terminate/i.test(f.summary),
  );
  if (mentionsReplacement && !alreadyOpenReasons.has("cancellation_or_replacement_mentioned")) {
    triggers.push({
      reason: "cancellation_or_replacement_mentioned",
      detail: "Client feedback mentions cancellation or replacement.",
    });
  }

  // Security / confidentiality / harassment / compliance / payroll / safety
  const sensitiveIssue = ctx.issues.find(
    (i) =>
      i.status !== "Closed" &&
      /security|confidential|harassment|compliance|payroll|safety/i.test(`${i.title} ${i.description}`),
  );
  if (sensitiveIssue && !alreadyOpenReasons.has("security_confidentiality_harassment_compliance_payroll_safety")) {
    triggers.push({
      reason: "security_confidentiality_harassment_compliance_payroll_safety",
      detail: `Issue "${sensitiveIssue.title}" involves a mandatory-escalation category.`,
    });
  }

  // Professional misses a complete shift without contact.
  const unnotifiedFullAbsence = ctx.attendance.find(
    (a) => a.eventType === "absent_full_shift" && !a.notifiedInAdvance && daysBetween(a.date, asOf) <= 2,
  );
  if (unnotifiedFullAbsence && !alreadyOpenReasons.has("full_shift_absence_no_contact")) {
    triggers.push({
      reason: "full_shift_absence_no_contact",
      detail: `Full-shift absence with no advance notice on ${unnotifiedFullAbsence.date}.`,
    });
  }

  // High-severity issue with no owner within 4 hours of being reported.
  const unownedHighSeverity = ctx.issues.find(
    (i) =>
      i.status !== "Closed" &&
      i.severity === "high" &&
      !i.owner &&
      hoursBetween(i.reportedAt, asOf) >= ESCALATION_SLA.highSeverityOwnerHours,
  );
  if (unownedHighSeverity && !alreadyOpenReasons.has("high_severity_no_owner_4h")) {
    triggers.push({
      reason: "high_severity_no_owner_4h",
      detail: `High-severity issue "${unownedHighSeverity.title}" has had no owner for 4+ hours.`,
    });
  }

  // Critical issue with no credible fix within 24 hours.
  const staleCritical = ctx.issues.find(
    (i) =>
      i.severity === "critical" &&
      i.status !== "Closed" &&
      !i.fixImplementedAt &&
      hoursBetween(i.reportedAt, asOf) >= ESCALATION_SLA.criticalFixHours,
  );
  if (staleCritical && !alreadyOpenReasons.has("critical_no_fix_24h")) {
    triggers.push({
      reason: "critical_no_fix_24h",
      detail: `Critical issue "${staleCritical.title}" has had no fix for 24+ hours.`,
    });
  }

  // Issue recurs during monitoring.
  const recurredDuringMonitoring = ctx.issues.find((i) => i.recurrenceCount > 0);
  if (recurredDuringMonitoring && !alreadyOpenReasons.has("recurrence_during_monitoring")) {
    triggers.push({
      reason: "recurrence_during_monitoring",
      detail: `Issue "${recurredDuringMonitoring.title}" recurred during its monitoring window.`,
    });
  }

  // Client feedback reaches red (at-risk silence) status during trial, or
  // an actual negative-sentiment trial feedback record.
  const trialSilence = assessSilence(ctx, asOf);
  const trialRedFeedback =
    trialSilence.level === "at_risk" && asOf <= ctx.placement.trialEndDate;
  const negativeTrialFeedback = ctx.feedback.some(
    (f) => f.isTrialCheckpoint && f.sentiment === "negative",
  );
  if ((trialRedFeedback || negativeTrialFeedback) && !alreadyOpenReasons.has("trial_feedback_red")) {
    triggers.push({
      reason: "trial_feedback_red",
      detail: trialRedFeedback
        ? "Trial feedback checkpoint is at-risk (red) for silence."
        : "Trial feedback checkpoint recorded negative sentiment.",
    });
  }

  return triggers;
}
