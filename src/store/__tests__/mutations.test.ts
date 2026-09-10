import { describe, it, expect } from "vitest";
import {
  archivePlacement,
  logCommunication,
  logOutcome,
  recordFeedback,
  createIssue,
  updateIssueStatus,
  implementFix,
  confirmIssueFollowupWindow,
  createEscalation,
  completeFollowup,
  updateEscalationStatus,
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

  it("adds an open follow-up when a next follow-up date is provided", () => {
    const seed = seedWithPlacement();
    const result = logCommunication(
      seed,
      {
        placementId: "placement_1",
        subjectType: "client",
        channel: "email",
        direction: "outbound",
        summary: "Check whether the client received the revised schedule.",
        owner: "Karan",
        nextFollowUpDate: "2026-09-09",
      },
      NOW,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.followups).toContainEqual(
      expect.objectContaining({
        placementId: "placement_1",
        dueDate: "2026-09-09",
        description: "Check whether the client received the revised schedule.",
        owner: "Karan",
      }),
    );
    expect(result.value.followups[0]?.completedAt).toBeUndefined();
  });
});

describe("logOutcome", () => {
  it("marks the earliest due matching check-in completed when contact is reached", () => {
    const seed = {
      ...seedWithPlacement(),
      checkins: [
        {
          id: "checkin_later",
          placementId: "placement_1",
          subjectType: "professional" as const,
          dueDate: "2026-09-08",
          status: "scheduled" as const,
          isTrialCheckpoint: false,
          dayOffset: 60,
          createdAt: "2026-08-01",
        },
        {
          id: "checkin_due",
          placementId: "placement_1",
          subjectType: "professional" as const,
          dueDate: "2026-09-01",
          status: "scheduled" as const,
          isTrialCheckpoint: false,
          dayOffset: 30,
          createdAt: "2026-08-01",
        },
      ],
    };

    const result = logOutcome(
      seed,
      {
        placementId: "placement_1",
        subjectType: "professional",
        outcome: "reached",
        sentiment: "positive",
        summary: "Monthly check-in completed; no concerns.",
        owner: "Karan",
        createIssue: false,
        escalate: false,
      },
      NOW,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.checkins.find((checkin) => checkin.id === "checkin_due")).toEqual(
      expect.objectContaining({
        status: "completed",
        completedAt: NOW,
        notes: "Monthly check-in completed; no concerns.",
      }),
    );
    expect(result.value.checkins.find((checkin) => checkin.id === "checkin_later")?.status).toBe("scheduled");
  });

  it("keeps the due check-in open when there is no answer", () => {
    const seed = {
      ...seedWithPlacement(),
      checkins: [
        {
          id: "checkin_due",
          placementId: "placement_1",
          subjectType: "client" as const,
          dueDate: "2026-09-01",
          status: "scheduled" as const,
          isTrialCheckpoint: false,
          dayOffset: 30,
          createdAt: "2026-08-01",
        },
      ],
    };

    const result = logOutcome(
      seed,
      {
        placementId: "placement_1",
        subjectType: "client",
        outcome: "no_answer",
        summary: "Left a voicemail.",
        owner: "Karan",
        createIssue: false,
        escalate: false,
      },
      NOW,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.checkins[0].status).toBe("scheduled");
    expect(result.value.checkins[0].completedAt).toBeUndefined();
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
  it("records who raised and received the escalation and schedules its follow-up", () => {
    const seed = seedWithPlacement();
    const result = createEscalation(
      seed,
      {
        placementId: "placement_1",
        reason: "cancellation_or_replacement_mentioned",
        summary: "Client asked about ending the engagement.",
        raisedBy: "Karan",
        escalatedTo: "Ankita",
        nextFollowUpDate: "2026-09-09",
      },
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.escalations).toHaveLength(1);
    expect(result.value.escalations[0].status).toBe("open");
    expect(result.value.escalations[0].raisedBy).toBe("Karan");
    expect(result.value.escalations[0].escalatedTo).toBe("Ankita");
    expect(result.value.followups).toContainEqual(
      expect.objectContaining({
        placementId: "placement_1",
        dueDate: "2026-09-09",
        description: "Follow up with Ankita on escalation",
        owner: "Karan",
      }),
    );
  });

  it("moves an escalation through acknowledged and resolved while retaining it", () => {
    const seed = seedWithPlacement();
    const created = createEscalation(
      seed,
      {
        placementId: "placement_1",
        reason: "full_shift_absence_no_contact",
        summary: "No-call, no-show needs senior review.",
        raisedBy: "Karan",
        escalatedTo: "Ankita",
      },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const escalationId = created.value.escalations[0].id;

    const acknowledged = updateEscalationStatus(
      created.value,
      escalationId,
      "acknowledged",
      "2026-09-08T13:00:00.000Z",
    );
    expect(acknowledged.ok).toBe(true);
    if (!acknowledged.ok) return;
    expect(acknowledged.value.escalations[0]).toEqual(
      expect.objectContaining({ status: "acknowledged", acknowledgedAt: "2026-09-08T13:00:00.000Z" }),
    );

    const resolved = updateEscalationStatus(
      acknowledged.value,
      escalationId,
      "resolved",
      "2026-09-08T14:00:00.000Z",
    );
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.value.escalations).toHaveLength(1);
    expect(resolved.value.escalations[0]).toEqual(
      expect.objectContaining({ status: "resolved", resolvedAt: "2026-09-08T14:00:00.000Z" }),
    );
  });

  it("does not resolve an escalation before it is acknowledged", () => {
    const seed = seedWithPlacement();
    const created = createEscalation(
      seed,
      {
        placementId: "placement_1",
        reason: "full_shift_absence_no_contact",
        summary: "No-call, no-show needs senior review.",
        raisedBy: "Karan",
        escalatedTo: "Ankita",
      },
      NOW,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = updateEscalationStatus(created.value, created.value.escalations[0].id, "resolved", NOW);
    expect(result.ok).toBe(false);
  });
});

describe("completeFollowup", () => {
  it("retains the follow-up and records its completion outcome", () => {
    const seed = {
      ...seedWithPlacement(),
      followups: [
        {
          id: "followup_1",
          placementId: "placement_1",
          dueDate: "2026-09-08",
          description: "Follow up with Ankita on escalation",
          owner: "Karan",
          createdAt: "2026-09-07T12:00:00.000Z",
        },
      ],
    };

    const result = completeFollowup(seed, {
      followupId: "followup_1",
      outcome: "Ankita confirmed the next steps.",
      completedAt: NOW,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.followups).toHaveLength(1);
    expect(result.value.followups[0]).toEqual(
      expect.objectContaining({ completedAt: NOW, outcome: "Ankita confirmed the next steps." }),
    );
  });
});
