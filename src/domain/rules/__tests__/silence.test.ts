import { describe, it, expect } from "vitest";
import { assessSilence } from "../silence";
import { makeContext, makeFeedback, TODAY } from "./fixtures";

describe("assessSilence — trial cadence boundaries", () => {
  it("is none when nothing is overdue", () => {
    const ctx = makeContext({
      placement: { startDate: "2026-09-01", trialEndDate: "2026-10-01" },
      feedback: [makeFeedback({ scheduledFor: "2026-09-08", attemptCount: 0 })],
    });
    // scheduledFor === asOf, not yet overdue past threshold
    const result = assessSilence(ctx, TODAY);
    expect(result.level).toBe("none");
  });

  it("is watch at exactly 1 day overdue during trial", () => {
    const ctx = makeContext({
      placement: { startDate: "2026-08-15", trialEndDate: "2026-09-14" },
      feedback: [makeFeedback({ scheduledFor: "2026-09-07", attemptCount: 0 })],
    });
    const result = assessSilence(ctx, TODAY); // 1 day overdue, still within trial window
    expect(result.level).toBe("watch");
  });

  it("is at_risk at exactly 3 days overdue during trial", () => {
    const ctx = makeContext({
      placement: { startDate: "2026-08-15", trialEndDate: "2026-09-14" },
      feedback: [makeFeedback({ scheduledFor: "2026-09-05", attemptCount: 0 })],
    });
    const result = assessSilence(ctx, TODAY); // 3 days overdue, still within trial window
    expect(result.level).toBe("at_risk");
  });

  it("is watch (not yet at_risk) at 2 days overdue during trial", () => {
    const ctx = makeContext({
      placement: { startDate: "2026-08-15", trialEndDate: "2026-09-14" },
      feedback: [makeFeedback({ scheduledFor: "2026-09-06", attemptCount: 0 })],
    });
    const result = assessSilence(ctx, TODAY); // 2 days overdue, still within trial window
    expect(result.level).toBe("watch");
  });
});

describe("assessSilence — post-trial thresholds", () => {
  it("is none below 3 days overdue post-trial", () => {
    const ctx = makeContext({
      placement: { startDate: "2026-06-01", trialEndDate: "2026-07-01" },
      feedback: [makeFeedback({ scheduledFor: "2026-09-06", isTrialCheckpoint: false, dayOffset: 60, attemptCount: 0 })],
    });
    const result = assessSilence(ctx, TODAY); // 2 days overdue, post-trial
    expect(result.level).toBe("none");
  });

  it("is watch at exactly 3 days overdue post-trial", () => {
    const ctx = makeContext({
      placement: { startDate: "2026-06-01", trialEndDate: "2026-07-01" },
      feedback: [makeFeedback({ scheduledFor: "2026-09-05", isTrialCheckpoint: false, dayOffset: 60, attemptCount: 0 })],
    });
    const result = assessSilence(ctx, TODAY); // 3 days overdue
    expect(result.level).toBe("watch");
  });

  it("is at_risk at exactly 7 days overdue post-trial", () => {
    const ctx = makeContext({
      placement: { startDate: "2026-06-01", trialEndDate: "2026-07-01" },
      feedback: [makeFeedback({ scheduledFor: "2026-09-01", isTrialCheckpoint: false, dayOffset: 60, attemptCount: 0 })],
    });
    const result = assessSilence(ctx, TODAY); // 7 days overdue
    expect(result.level).toBe("at_risk");
  });
});

describe("assessSilence — unanswered attempts", () => {
  it("two unanswered attempts create at least watch-level silence risk even if not overdue by day count", () => {
    const ctx = makeContext({
      placement: { startDate: "2026-09-01", trialEndDate: "2026-10-01" },
      feedback: [makeFeedback({ scheduledFor: "2026-09-08", attemptCount: 2 })],
    });
    const result = assessSilence(ctx, TODAY);
    expect(result.level).not.toBe("none");
  });

  it("one unanswered attempt alone (not overdue) does not create silence risk", () => {
    const ctx = makeContext({
      placement: { startDate: "2026-09-01", trialEndDate: "2026-10-01" },
      feedback: [makeFeedback({ scheduledFor: "2026-09-08", attemptCount: 1 })],
    });
    const result = assessSilence(ctx, TODAY);
    expect(result.level).toBe("none");
  });
});
