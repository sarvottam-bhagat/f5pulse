// Aggregates all data relevant to a single professional across every
// placement they've ever had, for the Professional detail page.

import type { Seed, Professional, Placement, AttendanceRecord, FeedbackRecord, Issue } from "../types";

export interface ProfessionalView {
  professional: Professional;
  currentPlacement: Placement | null;
  historicalPlacements: Placement[];
  attendance: AttendanceRecord[];
  performanceFeedback: FeedbackRecord[];
  openConcerns: Issue[];
}

export function buildProfessionalView(seed: Seed, professionalId: string): ProfessionalView | null {
  const professional = seed.professionals.find((p) => p.id === professionalId);
  if (!professional) return null;

  const allPlacements = seed.placements.filter((p) => p.professionalId === professionalId);
  const currentPlacement = allPlacements.find((p) => p.status === "Active" && !p.archived) ?? null;
  const historicalPlacements = allPlacements.filter((p) => p.status === "Ended" || p.archived);

  const placementIds = new Set(allPlacements.map((p) => p.id));
  const attendance = seed.attendance
    .filter((a) => a.professionalId === professionalId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const performanceFeedback = seed.feedback
    .filter((f) => placementIds.has(f.placementId) && f.subjectType === "professional")
    .sort((a, b) => (a.scheduledFor < b.scheduledFor ? 1 : -1));
  const openConcerns = seed.issues.filter(
    (i) => placementIds.has(i.placementId) && i.status !== "Closed" && i.source !== "client_complaint",
  );

  return { professional, currentPlacement, historicalPlacements, attendance, performanceFeedback, openConcerns };
}
