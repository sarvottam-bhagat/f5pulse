import { describe, it, expect } from "vitest";
import { assessHealth } from "../health";
import {
  makeContext,
  makeFeedback,
  makeIssue,
  makeAttendance,
  makeEscalation,
  makeCheckin,
  TODAY,
} from "./fixtures";

describe("assessHealth precedence — highest matching state wins", () => {
  it("is Healthy with no signals", () => {
    const ctx = makeContext();
    const result = assessHealth(ctx, TODAY);
    expect(result.state).toBe("Healthy");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("is Watch with an overdue professional check-in", () => {
    const ctx = makeContext({
      checkins: [makeCheckin({ status: "scheduled", dueDate: "2026-09-01" })],
    });
    const result = assessHealth(ctx, TODAY);
    expect(result.state).toBe("Watch");
  });

  it("is At Risk with an unresolved high-severity issue, even though Watch conditions also apply", () => {
    const ctx = makeContext({
      checkins: [makeCheckin({ status: "scheduled", dueDate: "2026-09-01" })], // Watch-level
      // owner assigned so this does NOT also trip the "high-severity, no owner
      // for 4h" mandatory-escalation rule — this test isolates At Risk precedence.
      issues: [makeIssue({ severity: "high", status: "Investigating", owner: "Jamie Ortiz" })],
    });
    const result = assessHealth(ctx, TODAY);
    expect(result.state).toBe("At Risk");
    // both reasons should still be present even though At Risk wins
    expect(result.reasons.some((r) => r.includes("Professional check-in overdue"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("Unresolved high-severity issue"))).toBe(true);
  });

  it("is Critical with an open escalation, even though At Risk and Watch conditions also apply", () => {
    const ctx = makeContext({
      checkins: [makeCheckin({ status: "scheduled", dueDate: "2026-09-01" })],
      issues: [makeIssue({ severity: "high", status: "Investigating" })],
      escalations: [makeEscalation({ status: "open" })],
    });
    const result = assessHealth(ctx, TODAY);
    expect(result.state).toBe("Critical");
  });

  it("is At Risk on negative client feedback alone", () => {
    const ctx = makeContext({
      // post-trial (isTrialCheckpoint: false) so this doesn't also trip the
      // "trial feedback red" mandatory-escalation rule — isolates At Risk.
      feedback: [
        makeFeedback({ sentiment: "negative", summary: "Unhappy with service.", isTrialCheckpoint: false, dayOffset: 60 }),
      ],
    });
    const result = assessHealth(ctx, TODAY);
    expect(result.state).toBe("At Risk");
  });

  it("is Watch with two or more attendance concerns", () => {
    const ctx = makeContext({
      attendance: [
        makeAttendance({ eventType: "late", date: "2026-09-01" }),
        makeAttendance({ id: "attendance_2", eventType: "late", date: "2026-09-03" }),
      ],
    });
    const result = assessHealth(ctx, TODAY);
    expect(result.state).toBe("Watch");
  });

  it("is Watch when an issue is in Monitoring", () => {
    const ctx = makeContext({
      issues: [makeIssue({ status: "Monitoring" })],
    });
    const result = assessHealth(ctx, TODAY);
    expect(result.state).toBe("Watch");
  });

  it("always includes exact reasons for the resulting state", () => {
    const ctx = makeContext({
      escalations: [makeEscalation({ status: "open", summary: "Client mentioned cancellation." })],
    });
    const result = assessHealth(ctx, TODAY);
    expect(result.reasons.some((r) => r.includes("Client mentioned cancellation."))).toBe(true);
  });
});
