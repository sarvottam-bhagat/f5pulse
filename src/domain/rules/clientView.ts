// Aggregates all data relevant to a single client across every placement
// they've ever had (active + historical), for the Client detail page.

import type {
  Seed,
  Client,
  Placement,
  Professional,
  FeedbackRecord,
  Communication,
  Issue,
  HealthAssessment,
  HealthState,
} from "../types";
import { assessSilence } from "./silence";
import { buildPlacementContext } from "./context";
import { assessHealth } from "./health";

export interface ClientAssignmentSummary {
  placement: Placement;
  professional: Professional;
  health: HealthAssessment;
  openIssues: Issue[];
  feedbackDueCount: number;
  latestClientFeedback: FeedbackRecord | null;
  nextClientFeedback: FeedbackRecord | null;
}

export interface ClientView {
  client: Client;
  activePlacements: Placement[];
  historicalPlacements: Placement[];
  feedbackHistory: FeedbackRecord[];
  communicationHistory: Communication[];
  openIssues: Issue[];
  isSilent: boolean;
  hasNegativeFeedback: boolean;
  assignments: ClientAssignmentSummary[];
  overallHealth: HealthState;
  stats: {
    activeProfessionals: number;
    inTrial: number;
    openIssues: number;
    feedbackDue: number;
  };
  lastClientContact: Communication | null;
  nextClientFeedback: FeedbackRecord | null;
}

export function buildClientView(seed: Seed, clientId: string, asOf: string): ClientView | null {
  const client = seed.clients.find((c) => c.id === clientId);
  if (!client) return null;

  const allPlacements = seed.placements.filter((p) => p.clientId === clientId);
  const activePlacements = allPlacements.filter((p) => p.status === "Active" && !p.archived);
  const historicalPlacements = allPlacements.filter((p) => p.status === "Ended" || p.archived);

  const placementIds = new Set(allPlacements.map((p) => p.id));
  const feedbackHistory = seed.feedback
    .filter((f) => placementIds.has(f.placementId) && f.subjectType === "client")
    .sort((a, b) => (a.scheduledFor < b.scheduledFor ? 1 : -1));
  const communicationHistory = seed.communications
    .filter((c) => placementIds.has(c.placementId) && c.subjectType === "client")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const openIssues = seed.issues.filter((i) => placementIds.has(i.placementId) && i.status !== "Closed");

  const assignments = activePlacements.flatMap((placement): ClientAssignmentSummary[] => {
    const professional = seed.professionals.find((item) => item.id === placement.professionalId);
    const context = buildPlacementContext(seed, placement.id);
    if (!professional || !context) return [];

    const placementFeedback = feedbackHistory.filter((feedback) => feedback.placementId === placement.id);
    const outstandingFeedback = placementFeedback
      .filter((feedback) => !feedback.collectedAt)
      .sort((left, right) => left.scheduledFor.localeCompare(right.scheduledFor));

    return [{
      placement,
      professional,
      health: assessHealth(context, asOf),
      openIssues: openIssues.filter((issue) => issue.placementId === placement.id),
      feedbackDueCount: outstandingFeedback.filter((feedback) => feedback.scheduledFor <= asOf).length,
      latestClientFeedback: placementFeedback.find((feedback) => Boolean(feedback.collectedAt)) ?? null,
      nextClientFeedback: outstandingFeedback[0] ?? null,
    }];
  });

  const healthOrder: HealthState[] = ["Healthy", "Watch", "At Risk", "Critical"];
  const overallHealth = assignments.reduce<HealthState>(
    (current, assignment) => healthOrder.indexOf(assignment.health.state) > healthOrder.indexOf(current) ? assignment.health.state : current,
    "Healthy",
  );
  const outstandingClientFeedback = feedbackHistory
    .filter((feedback) => !feedback.collectedAt)
    .sort((left, right) => left.scheduledFor.localeCompare(right.scheduledFor));

  let isSilent = false;
  for (const placement of activePlacements) {
    const ctx = buildPlacementContext(seed, placement.id);
    if (ctx && assessSilence(ctx, asOf).level === "at_risk") {
      isSilent = true;
      break;
    }
  }

  const hasNegativeFeedback = feedbackHistory.some((f) => f.sentiment === "negative");

  return {
    client,
    activePlacements,
    historicalPlacements,
    feedbackHistory,
    communicationHistory,
    openIssues,
    isSilent,
    hasNegativeFeedback,
    assignments,
    overallHealth,
    stats: {
      activeProfessionals: assignments.length,
      inTrial: assignments.filter(({ placement }) => placement.startDate <= asOf && placement.trialEndDate >= asOf).length,
      openIssues: openIssues.length,
      feedbackDue: assignments.reduce((total, assignment) => total + assignment.feedbackDueCount, 0),
    },
    lastClientContact: communicationHistory[0] ?? null,
    nextClientFeedback: outstandingClientFeedback[0] ?? null,
  };
}
