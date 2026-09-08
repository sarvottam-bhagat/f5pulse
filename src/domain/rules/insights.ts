// Additional dashboard insights beyond the priority queue: trial radar,
// feedback/silence trends, attendance/performance signals, issue pipeline,
// recurring problems, upcoming monthly check-ins, and the follow-up
// calendar. Each is a small, focused read model over PlacementContext[].

import { addDays, daysBetween } from "../dates";
import type { PlacementContext } from "./context";
import { assessSilence } from "./silence";

export interface TrialRadarItem {
  placementId: string;
  clientName: string;
  professionalName: string;
  daysIntoTrial: number;
  daysRemaining: number;
  trialEndDate: string;
}

export function buildTrialRadar(contexts: PlacementContext[], asOf: string): TrialRadarItem[] {
  return contexts
    .filter((ctx) => ctx.placement.status === "Active" && asOf <= ctx.placement.trialEndDate)
    .map((ctx) => ({
      placementId: ctx.placement.id,
      clientName: ctx.client.companyName,
      professionalName: ctx.professional.fullName,
      daysIntoTrial: daysBetween(ctx.placement.startDate, asOf),
      daysRemaining: daysBetween(asOf, ctx.placement.trialEndDate),
      trialEndDate: ctx.placement.trialEndDate,
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export interface FeedbackTrendPoint {
  placementId: string;
  clientName: string;
  silenceLevel: "none" | "watch" | "at_risk";
  lastPositiveAt: string | null;
  lastNegativeAt: string | null;
  negativeCount: number;
}

export function buildFeedbackTrends(contexts: PlacementContext[], asOf: string): FeedbackTrendPoint[] {
  return contexts.map((ctx) => {
    const clientFeedback = ctx.feedback.filter((f) => f.subjectType === "client" && f.collectedAt);
    const positives = clientFeedback.filter((f) => f.sentiment === "positive");
    const negatives = clientFeedback.filter((f) => f.sentiment === "negative");
    return {
      placementId: ctx.placement.id,
      clientName: ctx.client.companyName,
      silenceLevel: assessSilence(ctx, asOf).level,
      lastPositiveAt: positives.length > 0 ? positives[positives.length - 1].collectedAt ?? null : null,
      lastNegativeAt: negatives.length > 0 ? negatives[negatives.length - 1].collectedAt ?? null : null,
      negativeCount: negatives.length,
    };
  });
}

export interface AttendanceSignal {
  placementId: string;
  professionalName: string;
  clientName: string;
  lateCount: number;
  absentCount: number;
  onTimeCount: number;
}

export function buildAttendanceSignals(contexts: PlacementContext[]): AttendanceSignal[] {
  return contexts
    .map((ctx) => ({
      placementId: ctx.placement.id,
      professionalName: ctx.professional.fullName,
      clientName: ctx.client.companyName,
      lateCount: ctx.attendance.filter((a) => a.eventType === "late").length,
      absentCount: ctx.attendance.filter((a) => a.eventType === "absent_full_shift" || a.eventType === "absent_partial").length,
      onTimeCount: ctx.attendance.filter((a) => a.eventType === "on_time").length,
    }))
    .filter((s) => s.lateCount > 0 || s.absentCount > 0)
    .sort((a, b) => b.lateCount + b.absentCount - (a.lateCount + a.absentCount));
}

export interface IssuePipelineCounts {
  Reported: number;
  Investigating: number;
  "Fix in progress": number;
  Monitoring: number;
  Closed: number;
}

export function buildIssuePipeline(contexts: PlacementContext[]): IssuePipelineCounts {
  const counts: IssuePipelineCounts = {
    Reported: 0,
    Investigating: 0,
    "Fix in progress": 0,
    Monitoring: 0,
    Closed: 0,
  };
  for (const ctx of contexts) {
    for (const issue of ctx.issues) {
      counts[issue.status] += 1;
    }
  }
  return counts;
}

export interface RecurringProblem {
  placementId: string;
  clientName: string;
  issueTitle: string;
  recurrenceCount: number;
  reopenedCount: number;
}

export function buildRecurringProblems(contexts: PlacementContext[]): RecurringProblem[] {
  const items: RecurringProblem[] = [];
  for (const ctx of contexts) {
    for (const issue of ctx.issues) {
      if (issue.recurrenceCount > 0 || issue.reopenedCount > 0) {
        items.push({
          placementId: ctx.placement.id,
          clientName: ctx.client.companyName,
          issueTitle: issue.title,
          recurrenceCount: issue.recurrenceCount,
          reopenedCount: issue.reopenedCount,
        });
      }
    }
  }
  return items.sort((a, b) => b.recurrenceCount + b.reopenedCount - (a.recurrenceCount + a.reopenedCount));
}

export interface UpcomingCheckin {
  placementId: string;
  clientName: string;
  professionalName: string;
  subjectType: "client" | "professional";
  dueDate: string;
}

export function buildUpcomingMonthlyCheckins(
  contexts: PlacementContext[],
  asOf: string,
  withinDays = 14,
): UpcomingCheckin[] {
  const horizon = addDays(asOf, withinDays);
  const items: UpcomingCheckin[] = [];
  for (const ctx of contexts) {
    for (const c of ctx.checkins) {
      if (!c.isTrialCheckpoint && c.status === "scheduled" && c.dueDate > asOf && c.dueDate <= horizon) {
        items.push({
          placementId: ctx.placement.id,
          clientName: ctx.client.companyName,
          professionalName: ctx.professional.fullName,
          subjectType: c.subjectType,
          dueDate: c.dueDate,
        });
      }
    }
  }
  return items.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}

export interface FollowUpCalendarEntry {
  placementId: string;
  clientName: string;
  dueDate: string;
  description: string;
  owner: string;
  completed: boolean;
}

export function buildFollowUpCalendar(contexts: PlacementContext[], asOf: string, withinDays = 14): FollowUpCalendarEntry[] {
  const horizon = addDays(asOf, withinDays);
  const items: FollowUpCalendarEntry[] = [];
  for (const ctx of contexts) {
    for (const f of ctx.followups) {
      if (f.dueDate <= horizon) {
        items.push({
          placementId: ctx.placement.id,
          clientName: ctx.client.companyName,
          dueDate: f.dueDate,
          description: f.description,
          owner: f.owner,
          completed: !!f.completedAt,
        });
      }
    }
  }
  return items.sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
}
