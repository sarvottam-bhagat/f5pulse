// Cadence and threshold constants from the operating rules. Centralized so
// the seed generator, rules engine, and store all agree on the schedule.

export const TRIAL_LENGTH_DAYS = 30;

export const TRIAL_CLIENT_FEEDBACK_DAY_OFFSETS = [2, 7, 14, 21, 30] as const;
export const TRIAL_PROFESSIONAL_CHECKIN_DAY_OFFSETS = [3, 10, 21, 30] as const;
export const POST_TRIAL_CHECKIN_INTERVAL_DAYS = 30;

export const SILENCE_THRESHOLDS = {
  trialFeedback: { watchAfterDays: 1, atRiskAfterDays: 3 },
  postTrialFeedback: { watchAfterDays: 3, atRiskAfterDays: 7 },
} as const;

export const UNANSWERED_ATTEMPTS_FOR_SILENCE_RISK = 2;

export const FOLLOWUP_WINDOWS_AFTER_FIX = [
  { label: "24h" as const, hours: 24 },
  { label: "3d" as const, hours: 24 * 3 },
  { label: "7d" as const, hours: 24 * 7 },
];

export const ESCALATION_SLA = {
  highSeverityOwnerHours: 4,
  criticalFixHours: 24,
} as const;
