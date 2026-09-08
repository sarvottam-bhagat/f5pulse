// Generates the initial trial + post-trial checkpoint schedule for a
// freshly created placement. Used by the store when committing a new
// placement bundle (Add Placement wizard) and by the seed generator.

import type { Placement, FeedbackRecord, CheckinRecord } from "../types";
import { addDays } from "../dates";
import {
  TRIAL_CLIENT_FEEDBACK_DAY_OFFSETS,
  TRIAL_PROFESSIONAL_CHECKIN_DAY_OFFSETS,
  POST_TRIAL_CHECKIN_INTERVAL_DAYS,
} from "../cadence";

const POST_TRIAL_LOOKAHEAD_CHECKPOINTS = 3;

export interface GeneratedCheckpoints {
  feedback: FeedbackRecord[];
  checkins: CheckinRecord[];
}

export function generateInitialCheckpoints(
  placement: Placement,
  idFactory: () => string,
): GeneratedCheckpoints {
  const feedback: FeedbackRecord[] = [];
  const checkins: CheckinRecord[] = [];

  for (const dayOffset of TRIAL_CLIENT_FEEDBACK_DAY_OFFSETS) {
    feedback.push({
      id: idFactory(),
      placementId: placement.id,
      subjectType: "client",
      scheduledFor: addDays(placement.startDate, dayOffset),
      isTrialCheckpoint: true,
      dayOffset,
      attemptCount: 0,
      createdAt: placement.createdAt,
    });
  }

  for (const dayOffset of TRIAL_PROFESSIONAL_CHECKIN_DAY_OFFSETS) {
    checkins.push({
      id: idFactory(),
      placementId: placement.id,
      subjectType: "professional",
      dueDate: addDays(placement.startDate, dayOffset),
      isTrialCheckpoint: true,
      dayOffset,
      status: "scheduled",
      createdAt: placement.createdAt,
    });
  }

  let dayOffset = TRIAL_CLIENT_FEEDBACK_DAY_OFFSETS[TRIAL_CLIENT_FEEDBACK_DAY_OFFSETS.length - 1];
  for (let i = 0; i < POST_TRIAL_LOOKAHEAD_CHECKPOINTS; i += 1) {
    dayOffset += POST_TRIAL_CHECKIN_INTERVAL_DAYS;
    const dueDate = addDays(placement.startDate, dayOffset);
    for (const subjectType of ["client", "professional"] as const) {
      checkins.push({
        id: idFactory(),
        placementId: placement.id,
        subjectType,
        dueDate,
        isTrialCheckpoint: false,
        dayOffset,
        status: "scheduled",
        createdAt: placement.createdAt,
      });
    }
  }

  return { feedback, checkins };
}
