// Aggregates all data relevant to a single client across every placement
// they've ever had (active + historical), for the Client detail page.

import type { Seed, Client, Placement, FeedbackRecord, Communication, Issue } from "../types";
import { assessSilence } from "./silence";
import { buildPlacementContext } from "./context";

export interface ClientView {
  client: Client;
  activePlacements: Placement[];
  historicalPlacements: Placement[];
  feedbackHistory: FeedbackRecord[];
  communicationHistory: Communication[];
  openIssues: Issue[];
  isSilent: boolean;
  hasNegativeFeedback: boolean;
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
  };
}
