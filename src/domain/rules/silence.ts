// Silence risk: how overdue is the next feedback/checkin checkpoint, and
// have there been repeated unanswered contact attempts.

import type { FeedbackRecord } from "../types";
import { daysBetween } from "../dates";
import {
  SILENCE_THRESHOLDS,
  UNANSWERED_ATTEMPTS_FOR_SILENCE_RISK,
} from "../cadence";
import type { PlacementContext } from "./context";

export type SilenceLevel = "none" | "watch" | "at_risk";

export interface SilenceAssessment {
  level: SilenceLevel;
  overdueDays: number;
  reason: string | null;
  checkpoint: FeedbackRecord | null;
}

function isTrialActive(ctx: PlacementContext, asOf: string): boolean {
  return asOf <= ctx.placement.trialEndDate;
}

/**
 * Finds the earliest client-feedback checkpoint that is due (scheduledFor
 * <= asOf) and not yet collected. Returns null if none are outstanding.
 */
function findOldestOutstandingClientCheckpoint(
  ctx: PlacementContext,
  asOf: string,
): FeedbackRecord | null {
  const outstanding = ctx.feedback
    .filter((f) => f.subjectType === "client" && !f.collectedAt && f.scheduledFor <= asOf)
    .sort((a, b) => (a.scheduledFor < b.scheduledFor ? -1 : 1));
  return outstanding[0] ?? null;
}

export function assessSilence(ctx: PlacementContext, asOf: string): SilenceAssessment {
  const checkpoint = findOldestOutstandingClientCheckpoint(ctx, asOf);
  if (!checkpoint) {
    return { level: "none", overdueDays: 0, reason: null, checkpoint: null };
  }

  const overdueDays = Math.max(0, daysBetween(checkpoint.scheduledFor, asOf));
  const trial = isTrialActive(ctx, checkpoint.scheduledFor);
  const thresholds = trial ? SILENCE_THRESHOLDS.trialFeedback : SILENCE_THRESHOLDS.postTrialFeedback;

  let level: SilenceLevel = "none";
  if (overdueDays >= thresholds.atRiskAfterDays) {
    level = "at_risk";
  } else if (overdueDays >= thresholds.watchAfterDays) {
    level = "watch";
  }

  // Two or more unanswered contact attempts toward this checkpoint always
  // constitutes silence risk (at least Watch), regardless of day count.
  if (checkpoint.attemptCount >= UNANSWERED_ATTEMPTS_FOR_SILENCE_RISK && level === "none") {
    level = "watch";
  }
  if (checkpoint.attemptCount >= UNANSWERED_ATTEMPTS_FOR_SILENCE_RISK && level === "watch" && overdueDays > 0) {
    level = "at_risk";
  }

  let reason: string | null = null;
  if (level !== "none") {
    const parts: string[] = [];
    if (overdueDays > 0) {
      parts.push(
        `${trial ? "Trial" : "Post-trial"} feedback checkpoint (day ${checkpoint.dayOffset}) is ${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`,
      );
    }
    if (checkpoint.attemptCount >= UNANSWERED_ATTEMPTS_FOR_SILENCE_RISK) {
      parts.push(`${checkpoint.attemptCount} unanswered contact attempts`);
    }
    reason = parts.join("; ");
  }

  return { level, overdueDays, reason, checkpoint };
}
