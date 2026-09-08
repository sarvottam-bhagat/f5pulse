// Assembles all records related to a single placement into one bundle so
// the rest of the rules engine can work with a single, denormalized shape
// instead of re-joining arrays everywhere.

import type {
  Seed,
  Placement,
  Client,
  Professional,
  FeedbackRecord,
  AttendanceRecord,
  CheckinRecord,
  Issue,
  Followup,
  Communication,
  Escalation,
} from "../types";

export interface PlacementContext {
  placement: Placement;
  client: Client;
  professional: Professional;
  feedback: FeedbackRecord[];
  attendance: AttendanceRecord[];
  checkins: CheckinRecord[];
  issues: Issue[];
  followups: Followup[];
  communications: Communication[];
  escalations: Escalation[];
}

export function buildPlacementContext(seed: Seed, placementId: string): PlacementContext | null {
  const placement = seed.placements.find((p) => p.id === placementId);
  if (!placement) return null;
  const client = seed.clients.find((c) => c.id === placement.clientId);
  const professional = seed.professionals.find((p) => p.id === placement.professionalId);
  if (!client || !professional) return null;

  return {
    placement,
    client,
    professional,
    feedback: seed.feedback.filter((f) => f.placementId === placementId),
    attendance: seed.attendance.filter((a) => a.placementId === placementId),
    checkins: seed.checkins.filter((c) => c.placementId === placementId),
    issues: seed.issues.filter((i) => i.placementId === placementId),
    followups: seed.followups.filter((f) => f.placementId === placementId),
    communications: seed.communications.filter((c) => c.placementId === placementId),
    escalations: seed.escalations.filter((e) => e.placementId === placementId),
  };
}

export function buildAllPlacementContexts(seed: Seed): PlacementContext[] {
  return seed.placements
    .filter((p) => !p.archived)
    .map((p) => buildPlacementContext(seed, p.id))
    .filter((c): c is PlacementContext => c !== null);
}
