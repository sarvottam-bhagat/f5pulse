// Validates the seed dataset for referential integrity, dropping any
// record that references a placement/client/professional/issue that
// doesn't exist, and reporting how many were skipped. Guards against a
// malformed or hand-edited JSON seed file crashing the app.

import type { Seed } from "../domain/types";

export interface ValidationResult {
  seed: Seed;
  skippedCount: number;
}

export function validateAndCleanSeed(raw: Seed): ValidationResult {
  let skippedCount = 0;

  const clientIds = new Set(raw.clients.map((c) => c.id));
  const professionalIds = new Set(raw.professionals.map((p) => p.id));

  const placements = raw.placements.filter((p) => {
    const valid = clientIds.has(p.clientId) && professionalIds.has(p.professionalId);
    if (!valid) skippedCount += 1;
    return valid;
  });
  const placementIds = new Set(placements.map((p) => p.id));

  function keepByPlacement<T extends { placementId: string }>(records: T[]): T[] {
    return records.filter((r) => {
      const valid = placementIds.has(r.placementId);
      if (!valid) skippedCount += 1;
      return valid;
    });
  }

  const issues = keepByPlacement(raw.issues);
  const issueIds = new Set(issues.map((i) => i.id));

  const followups = keepByPlacement(raw.followups).filter((f) => {
    if (f.relatedIssueId && !issueIds.has(f.relatedIssueId)) {
      skippedCount += 1;
      return false;
    }
    return true;
  });

  const escalations = keepByPlacement(raw.escalations).filter((e) => {
    if (e.relatedIssueId && !issueIds.has(e.relatedIssueId)) {
      skippedCount += 1;
      return false;
    }
    return true;
  });

  return {
    seed: {
      clients: raw.clients,
      professionals: raw.professionals,
      placements,
      feedback: keepByPlacement(raw.feedback),
      attendance: keepByPlacement(raw.attendance).filter((a) => {
        const valid = professionalIds.has(a.professionalId);
        if (!valid) skippedCount += 1;
        return valid;
      }),
      checkins: keepByPlacement(raw.checkins),
      issues,
      followups,
      communications: keepByPlacement(raw.communications),
      escalations,
      auditLog: keepByPlacement(raw.auditLog),
    },
    skippedCount,
  };
}
