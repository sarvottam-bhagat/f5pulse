import type { Seed } from "../domain/types";

import clients from "../data/seed/clients.json";
import professionals from "../data/seed/professionals.json";
import placements from "../data/seed/placements.json";
import feedback from "../data/seed/feedback.json";
import attendance from "../data/seed/attendance.json";
import checkins from "../data/seed/checkins.json";
import issues from "../data/seed/issues.json";
import followups from "../data/seed/followups.json";
import communications from "../data/seed/communications.json";
import escalations from "../data/seed/escalations.json";
import auditLog from "../data/seed/auditLog.json";

/**
 * Returns a fresh deep copy of the original JSON seed data every time it's
 * called, so callers (store init, reset-demo-data) can never accidentally
 * mutate the module-level seed by holding a shared reference.
 */
export function loadOriginalSeed(): Seed {
  return JSON.parse(
    JSON.stringify({
      clients,
      professionals,
      placements,
      feedback,
      attendance,
      checkins,
      issues,
      followups,
      communications,
      escalations,
      auditLog,
    }),
  ) as Seed;
}
