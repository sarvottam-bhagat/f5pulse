import { describe, it, expect } from "vitest";
import {
  canTransition,
  markFixImplemented,
  confirmFollowupWindow,
  reopenIssue,
  dueFollowupWindows,
} from "../issueLifecycle";
import { makeIssue } from "./fixtures";

describe("issue lifecycle transitions", () => {
  it("allows Reported -> Investigating -> Fix in progress -> Monitoring -> Closed", () => {
    expect(canTransition("Reported", "Investigating")).toBe(true);
    expect(canTransition("Investigating", "Fix in progress")).toBe(true);
    expect(canTransition("Fix in progress", "Monitoring")).toBe(true);
    expect(canTransition("Monitoring", "Closed")).toBe(true);
  });

  it("disallows Fix in progress -> Closed directly", () => {
    expect(canTransition("Fix in progress", "Closed")).toBe(false);
  });

  it("markFixImplemented moves Fix in progress -> Monitoring and creates 24h/3d/7d windows", () => {
    const issue = makeIssue({ status: "Fix in progress" });
    const { issue: updated, error } = markFixImplemented(issue, "Added a checklist", "2026-09-08T12:00:00.000Z");
    expect(error).toBeUndefined();
    expect(updated.status).toBe("Monitoring");
    expect(updated.followupWindows).toHaveLength(3);
    expect(updated.followupWindows.map((w) => w.windowLabel)).toEqual(["24h", "3d", "7d"]);
    expect(updated.followupWindows[0].dueAt).toBe("2026-09-09T12:00:00.000Z");
    expect(updated.followupWindows[1].dueAt).toBe("2026-09-11T12:00:00.000Z");
    expect(updated.followupWindows[2].dueAt).toBe("2026-09-15T12:00:00.000Z");
  });

  it("markFixImplemented rejects from a status that cannot reach Monitoring", () => {
    const issue = makeIssue({ status: "Reported" });
    const { error } = markFixImplemented(issue, "desc", "2026-09-08T12:00:00.000Z");
    expect(error).toBeDefined();
  });

  it("failed confirmation (recurred) reopens to Fix in progress and increments recurrenceCount, triggering escalation", () => {
    const issue = makeIssue({
      status: "Monitoring",
      followupWindows: [{ id: "w1", dueAt: "2026-09-09T00:00:00.000Z", windowLabel: "24h" }],
    });
    const result = confirmFollowupWindow(issue, "w1", "recurred", "2026-09-09T01:00:00.000Z");
    expect(result.issue.status).toBe("Fix in progress");
    expect(result.issue.recurrenceCount).toBe(1);
    expect(result.escalationTriggered).toBe(true);
  });

  it("all windows confirmed held closes the issue", () => {
    const issue = makeIssue({
      status: "Monitoring",
      followupWindows: [
        { id: "w1", dueAt: "2026-09-09T00:00:00.000Z", windowLabel: "24h", completedAt: "2026-09-09T00:00:00.000Z", outcome: "held" },
        { id: "w2", dueAt: "2026-09-11T00:00:00.000Z", windowLabel: "3d" },
      ],
    });
    const result = confirmFollowupWindow(issue, "w2", "held", "2026-09-11T01:00:00.000Z");
    expect(result.issue.status).toBe("Closed");
    expect(result.issue.closedAt).toBe("2026-09-11T01:00:00.000Z");
    expect(result.escalationTriggered).toBe(false);
  });

  it("confirming one of several windows held does not close the issue early", () => {
    const issue = makeIssue({
      status: "Monitoring",
      followupWindows: [
        { id: "w1", dueAt: "2026-09-09T00:00:00.000Z", windowLabel: "24h" },
        { id: "w2", dueAt: "2026-09-11T00:00:00.000Z", windowLabel: "3d" },
      ],
    });
    const result = confirmFollowupWindow(issue, "w1", "held", "2026-09-09T01:00:00.000Z");
    expect(result.issue.status).toBe("Monitoring");
  });

  it("reopenIssue resets to Reported and increments reopenedCount", () => {
    const issue = makeIssue({ status: "Closed", reopenedCount: 0 });
    const { issue: updated, error } = reopenIssue(issue, "2026-09-08T00:00:00.000Z");
    expect(error).toBeUndefined();
    expect(updated.status).toBe("Reported");
    expect(updated.reopenedCount).toBe(1);
  });

  it("dueFollowupWindows returns only windows whose date has arrived and are not completed", () => {
    const issue = makeIssue({
      followupWindows: [
        { id: "w1", dueAt: "2026-09-07T00:00:00.000Z", windowLabel: "24h" }, // past due
        { id: "w2", dueAt: "2026-09-08T18:00:00.000Z", windowLabel: "3d" }, // due today, later time
        { id: "w3", dueAt: "2026-09-10T00:00:00.000Z", windowLabel: "7d" }, // future
        { id: "w4", dueAt: "2026-09-01T00:00:00.000Z", windowLabel: "24h", completedAt: "2026-09-01T00:00:00.000Z", outcome: "held" }, // already done
      ],
    });
    const due = dueFollowupWindows(issue, "2026-09-08");
    expect(due.map((w) => w.id).sort()).toEqual(["w1", "w2"]);
  });
});
