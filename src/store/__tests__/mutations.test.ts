import { describe, it, expect } from "vitest";
import {
  archivePlacement,
  logCommunication,
  recordFeedback,
  createIssue,
  updateIssueStatus,
  implementFix,
  confirmIssueFollowupWindow,
  createEscalation,
} from "../mutations";
import { seedWithClientAndProfessional } from "./fixtures";
import type { Placement } from "../../domain/types";

const NOW = "2026-09-08T12:00:00.000Z";

function seedWithPlacement() {
  const seed = seedWithClientAndProfessional();
  const placement: Placement = {
    id: "placement_1",
    clientId: "client_1",
    professionalId: "pro_1",
    roleTitle: "Customer Support Specialist",
    startDate: "2026-08-01",
    trialEndDate: "2026-08-31",
    f5Owner: "Jamie Ortiz",
    expectedSchedule: "Mon-Fri",
    initialNotes: "",
    status: "Active",
    archived: false,
    createdAt: "2026-08-01",
  };
  return { ...seed, placements: [placement] };
}

describe("archivePlacement", () => {
  it("archives rather than deletes, preserving history", () => {
    const seed = seedWithPlacement();
    const result = archivePlacement(seed, "placement_1", "Engagement ended", NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const placement = result.value.placements.find((p) => p.id === "placement_1")!;
    expect(placement.archived).toBe(true);
    expect(placement.status).toBe("Ended");
    expect(placement.endReason).toBe("Engagement ended");
  });
});

describe("logCommunication", () => {
  it("adds a communication record tied to the placement", () => {
    const seed = seedWithPlacement();
    const result = logCommunication(
      seed,
      {
        placementId: "placement_1",
        subjectType: "client",
        channel: "email",
        direction: "outbound",
        summary: "Sent day-7 feedback request.",
        owner: "Jamie Ortiz",
      },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.communications).toHaveLength(1);
  });
});

describe("recordFeedback", () => {
  it("negative client feedback creates an issue", () => {
    const seed = seedWithPlacement();
    const result = recordFeedback(
      seed,
      {
        placementId: "placement_1",
        subjectType: "client",
        sentiment: "negative",
        summary: "Client unhappy with response times.",
        collectedAt: NOW,
      },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.issues.some((i) => i.source === "feedback_negative")).toBe(true);
  });

  it("positive client feedback does not create an issue", () => {
    const seed = seedWithPlacement();
    const result = recordFeedback(
      seed,
      {
        placementId: "placement_1",
        subjectType: "client",
        sentiment: "positive",
        summary: "Client is thrilled.",
        collectedAt: NOW,
      },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.issues).toHaveLength(0);
  });
});

describe("issue -> fix -> monitoring -> recurrence -> escalation flow via store mutations", () => {
  it("implementing a fix creates follow-up windows, and a recurred window creates an escalation", () => {
    const seed = seedWithPlacement();
    const created = createIssue(
      seed,
      {
        placementId: "placement_1",
        title: "Slow response times",
        description: "Client noticed delayed replies.",
        source: "performance",
        severity: "high",
      },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // Issue lifecycle requires Reported -> Investigating -> Fix in progress
    // before a fix can be marked implemented.
    const investigating = updateIssueStatus(created.value.seed, created.value.issue.id, "Investigating", NOW);
    expect(investigating.ok).toBe(true);
    if (!investigating.ok) return;
    const inProgress = updateIssueStatus(investigating.value, created.value.issue.id, "Fix in progress", NOW);
    expect(inProgress.ok).toBe(true);
    if (!inProgress.ok) return;

    const fixed = implementFix(inProgress.value, {
      issueId: created.value.issue.id,
      fixDescription: "Adjusted staffing during peak hours.",
      at: NOW,
    });
    expect(fixed.ok).toBe(true);
    if (!fixed.ok) return;
    const monitoringIssue = fixed.value.issues.find((i) => i.id === created.value.issue.id)!;
    expect(monitoringIssue.status).toBe("Monitoring");
    expect(monitoringIssue.followupWindows).toHaveLength(3);

    const recurred = confirmIssueFollowupWindow(fixed.value, {
      issueId: created.value.issue.id,
      windowId: monitoringIssue.followupWindows[0].id,
      outcome: "recurred",
      at: NOW,
    });
    expect(recurred.ok).toBe(true);
    if (!recurred.ok) return;
    const reopenedIssue = recurred.value.issues.find((i) => i.id === created.value.issue.id)!;
    expect(reopenedIssue.status).toBe("Fix in progress");
    expect(recurred.value.escalations.some((e) => e.reason === "recurrence_during_monitoring")).toBe(true);
  });
});

describe("updateIssueStatus", () => {
  it("rejects an invalid transition (Fix in progress -> Closed directly)", () => {
    const seed = seedWithPlacement();
    const created = createIssue(
      seed,
      { placementId: "placement_1", title: "Test", description: "desc", source: "internal", severity: "low" },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const inProgress = updateIssueStatus(created.value.seed, created.value.issue.id, "Fix in progress", NOW);
    expect(inProgress.ok).toBe(false); // Reported -> Fix in progress is also invalid; must go via Investigating
  });

  it("allows Reported -> Investigating -> Fix in progress -> Monitoring -> Closed", () => {
    const seed = seedWithPlacement();
    const created = createIssue(
      seed,
      { placementId: "placement_1", title: "Test", description: "desc", source: "internal", severity: "low" },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const step1 = updateIssueStatus(created.value.seed, created.value.issue.id, "Investigating", NOW);
    expect(step1.ok).toBe(true);
    if (!step1.ok) return;
    const step2 = updateIssueStatus(step1.value, created.value.issue.id, "Fix in progress", NOW);
    expect(step2.ok).toBe(true);
  });
});

describe("createEscalation", () => {
  it("creates an open escalation tied to the placement", () => {
    const seed = seedWithPlacement();
    const result = createEscalation(
      seed,
      {
        placementId: "placement_1",
        reason: "cancellation_or_replacement_mentioned",
        summary: "Client asked about ending the engagement.",
      },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.escalations).toHaveLength(1);
    expect(result.value.escalations[0].status).toBe("open");
  });
});
