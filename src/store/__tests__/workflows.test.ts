// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { Store } from "../Store";
import { buildAllPlacementContexts, buildPriorityQueue, groupBySection } from "../../domain/rules";
import { getDemoToday } from "../../domain/dates";

beforeEach(() => {
  window.localStorage.clear();
});

describe("workflow: recurring-issue escalation via the store", () => {
  it("implementing a fix, then confirming a window as recurred, surfaces an escalation on the dashboard", () => {
    const store = new Store();
    const seed = store.getSeed();
    const activePlacement = seed.placements.find((p) => p.status === "Active" && !p.archived)!;
    const today = getDemoToday();

    const created = store.createIssue({
      placementId: activePlacement.id,
      title: "Workflow test issue",
      description: "Testing the recurrence escalation workflow end to end.",
      source: "performance",
      severity: "high",
      owner: "Jamie Ortiz",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const issueId = created.value.id;

    expect(store.updateIssueStatus(issueId, "Investigating").ok).toBe(true);
    expect(store.updateIssueStatus(issueId, "Fix in progress").ok).toBe(true);

    const fixed = store.implementFix({ issueId, fixDescription: "Applied a fix.", at: new Date().toISOString() });
    expect(fixed.ok).toBe(true);

    const issueAfterFix = store.getSeed().issues.find((i) => i.id === issueId)!;
    expect(issueAfterFix.status).toBe("Monitoring");
    const firstWindow = issueAfterFix.followupWindows[0];

    const confirmed = store.confirmIssueFollowupWindow({
      issueId,
      windowId: firstWindow.id,
      outcome: "recurred",
      at: new Date().toISOString(),
    });
    expect(confirmed.ok).toBe(true);

    const seedAfter = store.getSeed();
    const reopenedIssue = seedAfter.issues.find((i) => i.id === issueId)!;
    expect(reopenedIssue.status).toBe("Fix in progress");
    expect(seedAfter.escalations.some((e) => e.reason === "recurrence_during_monitoring" && e.relatedIssueId === issueId)).toBe(
      true,
    );

    // Dashboard should now surface this placement in escalate_now.
    const contexts = buildAllPlacementContexts(seedAfter);
    const cards = buildPriorityQueue(contexts, today);
    const grouped = groupBySection(cards);
    expect(grouped.escalate_now.some((c) => c.placementId === activePlacement.id)).toBe(true);
  });
});

describe("workflow: log outcome with escalate toggle raises an escalation immediately", () => {
  it("creates an open escalation visible on the dashboard right after logOutcome", () => {
    const store = new Store();
    const seed = store.getSeed();
    const activePlacement = seed.placements.find((p) => p.status === "Active" && !p.archived)!;
    const today = getDemoToday();

    const result = store.logOutcome({
      placementId: activePlacement.id,
      subjectType: "client",
      outcome: "reached",
      sentiment: "negative",
      summary: "Client mentioned they might cancel.",
      owner: "Jamie Ortiz",
      createIssue: false,
      escalate: true,
    });
    expect(result.ok).toBe(true);

    const seedAfter = store.getSeed();
    expect(seedAfter.escalations.some((e) => e.placementId === activePlacement.id && e.status === "open")).toBe(true);

    const contexts = buildAllPlacementContexts(seedAfter);
    const cards = buildPriorityQueue(contexts, today);
    const grouped = groupBySection(cards);
    expect(grouped.escalate_now.some((c) => c.placementId === activePlacement.id)).toBe(true);
  });
});
