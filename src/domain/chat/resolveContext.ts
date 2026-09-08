// Resolves a chat context attachment from a partial selection (client id,
// professional id, or placement id), applying the rule: selecting a
// professional auto-attaches their placement+client; selecting a client
// with several active placements requires the caller to disambiguate by
// choosing a placement first.

import type { Seed } from "../types";
import type { ChatContextAttachment } from "./types";

export interface ResolveResult {
  context: ChatContextAttachment | null;
  needsPlacementChoice?: { clientId: string; placementIds: string[] };
  error?: string;
}

export function resolveContextFromPlacement(seed: Seed, placementId: string): ResolveResult {
  const placement = seed.placements.find((p) => p.id === placementId);
  if (!placement) return { context: null, error: "Placement not found." };
  return {
    context: { placementId: placement.id, clientId: placement.clientId, professionalId: placement.professionalId },
  };
}

export function resolveContextFromProfessional(seed: Seed, professionalId: string): ResolveResult {
  const placement = seed.placements.find((p) => p.professionalId === professionalId && p.status === "Active" && !p.archived);
  if (!placement) {
    return { context: null, error: "This professional has no active placement to attach." };
  }
  return resolveContextFromPlacement(seed, placement.id);
}

export function resolveContextFromClient(seed: Seed, clientId: string): ResolveResult {
  const placements = seed.placements.filter((p) => p.clientId === clientId && p.status === "Active" && !p.archived);
  if (placements.length === 0) {
    return { context: null, error: "This client has no active placements to attach." };
  }
  if (placements.length > 1) {
    return { context: null, needsPlacementChoice: { clientId, placementIds: placements.map((p) => p.id) } };
  }
  return resolveContextFromPlacement(seed, placements[0].id);
}

export function attachIssue(context: ChatContextAttachment, issueId: string): ChatContextAttachment {
  return { ...context, issueId };
}
