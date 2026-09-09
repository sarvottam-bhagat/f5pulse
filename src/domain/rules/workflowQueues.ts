import type { EscalationStatus } from "../types";
import type { PlacementContext } from "./context";

export type FollowupTiming = "overdue" | "today" | "upcoming";

export interface FollowupQueueItem {
  followupId: string;
  placementId: string;
  clientName: string;
  professionalName: string;
  dueDate: string;
  description: string;
  owner: string;
  timing: FollowupTiming;
}

export interface EscalationTrackerItem {
  escalationId: string;
  placementId: string;
  clientName: string;
  professionalName: string;
  summary: string;
  status: EscalationStatus;
  raisedBy: string;
  escalatedTo: string;
  raisedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
}

export function buildFollowupQueue(contexts: PlacementContext[], asOf: string): FollowupQueueItem[] {
  return contexts
    .flatMap((context) =>
      context.followups
        .filter((followup) => !followup.completedAt)
        .map((followup) => ({
          followupId: followup.id,
          placementId: context.placement.id,
          clientName: context.client.companyName,
          professionalName: context.professional.fullName,
          dueDate: followup.dueDate,
          description: followup.description,
          owner: followup.owner,
          timing: followup.dueDate < asOf ? "overdue" as const : followup.dueDate === asOf ? "today" as const : "upcoming" as const,
        })),
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

const ESCALATION_STATUS_ORDER: EscalationStatus[] = ["open", "acknowledged", "resolved"];

export function buildEscalationTracker(contexts: PlacementContext[]): EscalationTrackerItem[] {
  return contexts
    .flatMap((context) =>
      context.escalations
        .filter((escalation) => Boolean(escalation.raisedBy))
        .map((escalation) => ({
          escalationId: escalation.id,
          placementId: context.placement.id,
          clientName: context.client.companyName,
          professionalName: context.professional.fullName,
          summary: escalation.summary,
          status: escalation.status,
          raisedBy: escalation.raisedBy!,
          escalatedTo: escalation.escalatedTo ?? "Senior manager",
          raisedAt: escalation.raisedAt,
          acknowledgedAt: escalation.acknowledgedAt,
          resolvedAt: escalation.resolvedAt,
        })),
    )
    .sort((a, b) => {
      const statusDifference = ESCALATION_STATUS_ORDER.indexOf(a.status) - ESCALATION_STATUS_ORDER.indexOf(b.status);
      if (statusDifference !== 0) return statusDifference;
      return b.raisedAt.localeCompare(a.raisedAt);
    });
}
