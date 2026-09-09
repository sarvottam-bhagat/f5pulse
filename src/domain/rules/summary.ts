// Morning summary tiles: the five-second numbers shown at the top of Home.
// Each tile doubles as a filter predicate over PlacementContext so the
// dashboard can reuse the same logic to filter the priority queue.

import type { PlacementContext } from "./context";
import { assessHealth } from "./health";
import { assessSilence } from "./silence";
import { dueFollowupWindows } from "./issueLifecycle";
import { detectMandatoryEscalations } from "./escalation";

export type SummaryTileKey =
  | "contacts_due_today"
  | "escalations"
  | "trial_placements"
  | "silent_clients"
  | "overdue_checkins"
  | "fixes_awaiting_confirmation";

export interface SummaryTile {
  key: SummaryTileKey;
  label: string;
  count: number;
}

export function contactsDueTodayPredicate(ctx: PlacementContext, asOf: string): boolean {
  const silence = assessSilence(ctx, asOf);
  const dueFeedback = ctx.feedback.some(
    (f) => f.subjectType === "client" && !f.collectedAt && f.scheduledFor <= asOf,
  );
  const dueProCheckin = ctx.checkins.some(
    (c) => c.subjectType === "professional" && c.status !== "completed" && c.dueDate <= asOf,
  );
  return silence.level !== "none" || dueFeedback || dueProCheckin;
}

export function escalationsPredicate(ctx: PlacementContext, asOf: string): boolean {
  const hasRecordedEscalation = ctx.escalations.some(
    (escalation) => escalation.status !== "resolved" && Boolean(escalation.raisedBy),
  );
  if (hasRecordedEscalation) return false;

  const pendingEscalation = ctx.escalations.some(
    (escalation) => escalation.status !== "resolved" && !escalation.raisedBy,
  );
  return pendingEscalation || detectMandatoryEscalations(ctx, asOf).length > 0;
}

export function trialPlacementPredicate(ctx: PlacementContext, asOf: string): boolean {
  return asOf <= ctx.placement.trialEndDate && ctx.placement.status !== "Ended";
}

export function silentClientPredicate(ctx: PlacementContext, asOf: string): boolean {
  return assessSilence(ctx, asOf).level === "at_risk";
}

export function overdueCheckinPredicate(ctx: PlacementContext, asOf: string): boolean {
  return ctx.checkins.some((c) => c.status !== "completed" && c.dueDate < asOf);
}

export function fixesAwaitingConfirmationPredicate(ctx: PlacementContext, asOf: string): boolean {
  return ctx.issues.some((i) => i.status === "Monitoring" && dueFollowupWindows(i, asOf).length > 0);
}

export const SUMMARY_TILE_DEFS: {
  key: SummaryTileKey;
  label: string;
  predicate: (ctx: PlacementContext, asOf: string) => boolean;
}[] = [
  { key: "contacts_due_today", label: "Contacts due today", predicate: contactsDueTodayPredicate },
  { key: "escalations", label: "Escalate now", predicate: escalationsPredicate },
  { key: "trial_placements", label: "Trial placements", predicate: trialPlacementPredicate },
  { key: "silent_clients", label: "Silent clients", predicate: silentClientPredicate },
  { key: "overdue_checkins", label: "Overdue check-ins", predicate: overdueCheckinPredicate },
  { key: "fixes_awaiting_confirmation", label: "Fixes awaiting confirmation", predicate: fixesAwaitingConfirmationPredicate },
];

export function buildSummaryTiles(contexts: PlacementContext[], asOf: string): SummaryTile[] {
  return SUMMARY_TILE_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    count: contexts.filter((ctx) => def.predicate(ctx, asOf)).length,
  }));
}

export function filterByTile(
  contexts: PlacementContext[],
  key: SummaryTileKey,
  asOf: string,
): PlacementContext[] {
  const def = SUMMARY_TILE_DEFS.find((d) => d.key === key);
  if (!def) return contexts;
  return contexts.filter((ctx) => def.predicate(ctx, asOf));
}

export interface HealthDistribution {
  Healthy: number;
  Watch: number;
  "At Risk": number;
  Critical: number;
}

export function buildHealthDistribution(contexts: PlacementContext[], asOf: string): HealthDistribution {
  const dist: HealthDistribution = { Healthy: 0, Watch: 0, "At Risk": 0, Critical: 0 };
  for (const ctx of contexts) {
    const { state } = assessHealth(ctx, asOf);
    dist[state] += 1;
  }
  return dist;
}
