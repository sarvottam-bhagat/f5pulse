import { describe, it, expect } from "vitest";
import { detectMandatoryEscalations } from "../escalation";
import { makeContext, makeFeedback, makeIssue, makeAttendance, makeEscalation, TODAY } from "./fixtures";

describe("detectMandatoryEscalations", () => {
  it("triggers on cancellation/replacement mention in negative feedback", () => {
    const ctx = makeContext({
      feedback: [
        makeFeedback({
          sentiment: "negative",
          summary: "Client said this is not a good fit and asked about replacement.",
        }),
      ],
    });
    const triggers = detectMandatoryEscalations(ctx, TODAY);
    expect(triggers.some((t) => t.reason === "cancellation_or_replacement_mentioned")).toBe(true);
  });

  it("triggers on security/confidentiality issue text", () => {
    const ctx = makeContext({
      issues: [makeIssue({ title: "Confidential data leak", status: "Investigating" })],
    });
    const triggers = detectMandatoryEscalations(ctx, TODAY);
    expect(triggers.some((t) => t.reason === "security_confidentiality_harassment_compliance_payroll_safety")).toBe(true);
  });

  it("triggers on full-shift absence without advance notice within the last 2 days", () => {
    const ctx = makeContext({
      attendance: [makeAttendance({ eventType: "absent_full_shift", notifiedInAdvance: false, date: "2026-09-07" })],
    });
    const triggers = detectMandatoryEscalations(ctx, TODAY);
    expect(triggers.some((t) => t.reason === "full_shift_absence_no_contact")).toBe(true);
  });

  it("does not trigger full-shift absence if notified in advance", () => {
    const ctx = makeContext({
      attendance: [makeAttendance({ eventType: "absent_full_shift", notifiedInAdvance: true, date: "2026-09-07" })],
    });
    const triggers = detectMandatoryEscalations(ctx, TODAY);
    expect(triggers.some((t) => t.reason === "full_shift_absence_no_contact")).toBe(false);
  });

  it("triggers on high-severity issue with no owner after 4+ hours", () => {
    const ctx = makeContext({
      issues: [
        makeIssue({
          severity: "high",
          status: "Reported",
          owner: undefined,
          reportedAt: "2026-09-08T00:00:00.000Z",
        }),
      ],
    });
    const triggers = detectMandatoryEscalations(ctx, "2026-09-08T06:00:00.000Z");
    expect(triggers.some((t) => t.reason === "high_severity_no_owner_4h")).toBe(true);
  });

  it("does not trigger high-severity-no-owner before 4 hours have elapsed", () => {
    const ctx = makeContext({
      issues: [
        makeIssue({
          severity: "high",
          status: "Reported",
          owner: undefined,
          reportedAt: "2026-09-08T00:00:00.000Z",
        }),
      ],
    });
    const triggers = detectMandatoryEscalations(ctx, "2026-09-08T02:00:00.000Z");
    expect(triggers.some((t) => t.reason === "high_severity_no_owner_4h")).toBe(false);
  });

  it("triggers on critical issue with no fix after 24+ hours", () => {
    const ctx = makeContext({
      issues: [
        makeIssue({
          severity: "critical",
          status: "Investigating",
          reportedAt: "2026-09-06T00:00:00.000Z",
        }),
      ],
    });
    const triggers = detectMandatoryEscalations(ctx, "2026-09-08T00:00:00.000Z");
    expect(triggers.some((t) => t.reason === "critical_no_fix_24h")).toBe(true);
  });

  it("triggers on recurrence during monitoring", () => {
    const ctx = makeContext({
      issues: [makeIssue({ status: "Monitoring", recurrenceCount: 1 })],
    });
    const triggers = detectMandatoryEscalations(ctx, TODAY);
    expect(triggers.some((t) => t.reason === "recurrence_during_monitoring")).toBe(true);
  });

  it("triggers on negative trial-checkpoint feedback (red status)", () => {
    const ctx = makeContext({
      placement: { trialEndDate: "2026-10-01" },
      feedback: [makeFeedback({ isTrialCheckpoint: true, sentiment: "negative", scheduledFor: TODAY })],
    });
    const triggers = detectMandatoryEscalations(ctx, TODAY);
    expect(triggers.some((t) => t.reason === "trial_feedback_red")).toBe(true);
  });

  it("does not re-trigger a reason that already has an open escalation", () => {
    const ctx = makeContext({
      issues: [makeIssue({ status: "Monitoring", recurrenceCount: 1 })],
      escalations: [makeEscalation({ reason: "recurrence_during_monitoring", status: "open" })],
    });
    const triggers = detectMandatoryEscalations(ctx, TODAY);
    expect(triggers.some((t) => t.reason === "recurrence_during_monitoring")).toBe(false);
  });
});
