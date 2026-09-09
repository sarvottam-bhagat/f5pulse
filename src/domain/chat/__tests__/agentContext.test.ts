import { describe, expect, it } from "vitest";
import type { Seed } from "@/domain/types";
import { seedWithClientAndProfessional } from "@/store/__tests__/fixtures";
import {
  buildAgentPlacementContext,
  serializeAgentPlacementContext,
} from "../agentContext";

function makeSeed(): Seed {
  const base = seedWithClientAndProfessional();
  return {
    ...base,
    clients: [
      base.clients[0],
      { ...base.clients[0], id: "client_other", companyName: "Other Client", email: "other@example.test" },
    ],
    professionals: [
      base.professionals[0],
      { ...base.professionals[0], id: "pro_other", fullName: "Other Professional", email: "other-pro@example.test" },
    ],
    placements: [
      {
        id: "placement_selected",
        clientId: "client_1",
        professionalId: "pro_1",
        roleTitle: "Customer Support Specialist",
        startDate: "2026-08-01",
        trialEndDate: "2026-08-31",
        f5Owner: "Jamie Ortiz",
        expectedSchedule: "Mon-Fri, 9-5 ET",
        initialNotes: "Priority account",
        status: "Active",
        archived: false,
        createdAt: "2026-07-20T00:00:00.000Z",
      },
      {
        id: "placement_other",
        clientId: "client_other",
        professionalId: "pro_other",
        roleTitle: "Bookkeeper",
        startDate: "2026-07-01",
        trialEndDate: "2026-07-31",
        f5Owner: "Other Owner",
        expectedSchedule: "Mon-Fri",
        initialNotes: "Unrelated",
        status: "Active",
        archived: false,
        createdAt: "2026-06-20T00:00:00.000Z",
      },
    ],
    feedback: [
      {
        id: "feedback_selected", placementId: "placement_selected", subjectType: "client",
        scheduledFor: "2026-09-01", collectedAt: "2026-09-01T10:00:00.000Z",
        sentiment: "positive", summary: "Strong work", attemptCount: 1,
        isTrialCheckpoint: false, dayOffset: 30, createdAt: "2026-09-01T10:00:00.000Z",
      },
      {
        id: "feedback_other", placementId: "placement_other", subjectType: "client",
        scheduledFor: "2026-09-01", attemptCount: 0, isTrialCheckpoint: false,
        dayOffset: 30, createdAt: "2026-09-01T10:00:00.000Z",
      },
    ],
    attendance: [
      {
        id: "attendance_selected", placementId: "placement_selected", professionalId: "pro_1",
        date: "2026-09-02", eventType: "late", minutesLate: 12,
        notifiedInAdvance: true, notes: "Traffic", createdAt: "2026-09-02T12:00:00.000Z",
      },
      {
        id: "attendance_other", placementId: "placement_other", professionalId: "pro_other",
        date: "2026-09-02", eventType: "on_time", notifiedInAdvance: true,
        createdAt: "2026-09-02T12:00:00.000Z",
      },
    ],
    checkins: [
      {
        id: "checkin_selected", placementId: "placement_selected", subjectType: "professional",
        dueDate: "2026-09-05", status: "overdue", isTrialCheckpoint: false,
        dayOffset: 30, createdAt: "2026-08-01T00:00:00.000Z",
      },
      {
        id: "checkin_other", placementId: "placement_other", subjectType: "client",
        dueDate: "2026-09-05", status: "scheduled", isTrialCheckpoint: false,
        dayOffset: 30, createdAt: "2026-08-01T00:00:00.000Z",
      },
    ],
    issues: [
      {
        id: "issue_selected", placementId: "placement_selected", title: "Response delay",
        description: "Replies exceeded SLA", source: "client_complaint", severity: "high",
        status: "Investigating", followupWindows: [], recurrenceCount: 0,
        reportedAt: "2026-09-03T00:00:00.000Z", reopenedCount: 0,
        createdAt: "2026-09-03T00:00:00.000Z",
      },
      {
        id: "issue_other", placementId: "placement_other", title: "Other issue",
        description: "Unrelated", source: "internal", severity: "low", status: "Reported",
        followupWindows: [], recurrenceCount: 0, reportedAt: "2026-09-03T00:00:00.000Z",
        reopenedCount: 0, createdAt: "2026-09-03T00:00:00.000Z",
      },
    ],
    followups: [
      {
        id: "followup_selected", placementId: "placement_selected", relatedIssueId: "issue_selected",
        dueDate: "2026-09-09", description: "Confirm reply times", owner: "Jamie Ortiz",
        createdAt: "2026-09-03T00:00:00.000Z",
      },
      {
        id: "followup_other", placementId: "placement_other", dueDate: "2026-09-09",
        description: "Unrelated", owner: "Other Owner", createdAt: "2026-09-03T00:00:00.000Z",
      },
    ],
    communications: [
      {
        id: "comm_selected", placementId: "placement_selected", subjectType: "client",
        channel: "email", direction: "outbound", outcome: "reached", summary: "Shared update",
        owner: "Jamie Ortiz", createdAt: "2026-09-04T00:00:00.000Z",
      },
      {
        id: "comm_other", placementId: "placement_other", subjectType: "client",
        channel: "phone", direction: "outbound", summary: "Unrelated", owner: "Other Owner",
        createdAt: "2026-09-04T00:00:00.000Z",
      },
    ],
    escalations: [
      {
        id: "escalation_selected", placementId: "placement_selected",
        reason: "high_severity_no_owner_4h", status: "open", relatedIssueId: "issue_selected",
        summary: "Needs owner", raisedAt: "2026-09-03T04:00:00.000Z",
        createdAt: "2026-09-03T04:00:00.000Z",
      },
      {
        id: "escalation_other", placementId: "placement_other",
        reason: "trial_feedback_red", status: "resolved", summary: "Unrelated",
        raisedAt: "2026-09-03T04:00:00.000Z", createdAt: "2026-09-03T04:00:00.000Z",
      },
    ],
    auditLog: [
      {
        id: "audit_selected", placementId: "placement_selected", action: "issue_created",
        detail: "Response delay reported", actor: "Jamie Ortiz", at: "2026-09-03T00:00:00.000Z",
      },
      {
        id: "audit_other", placementId: "placement_other", action: "issue_created",
        detail: "Unrelated", actor: "Other Owner", at: "2026-09-03T00:00:00.000Z",
      },
    ],
  };
}

describe("buildAgentPlacementContext", () => {
  it("includes every operational record for only the selected placement", () => {
    const context = buildAgentPlacementContext(makeSeed(), "placement_selected", "2026-09-08");

    expect(context?.client.companyName).toBe("Acme Co");
    expect(context?.professional.fullName).toBe("Alex Rivera");
    expect(context?.feedback.map((item) => item.id)).toEqual(["feedback_selected"]);
    expect(context?.attendance.map((item) => item.id)).toEqual(["attendance_selected"]);
    expect(context?.checkins.map((item) => item.id)).toEqual(["checkin_selected"]);
    expect(context?.issues.map((item) => item.id)).toEqual(["issue_selected"]);
    expect(context?.followups.map((item) => item.id)).toEqual(["followup_selected"]);
    expect(context?.communications.map((item) => item.id)).toEqual(["comm_selected"]);
    expect(context?.escalations.map((item) => item.id)).toEqual(["escalation_selected"]);
    expect(context?.auditLog.map((item) => item.id)).toEqual(["audit_selected"]);
    expect(context?.health.state).toBe("Critical");
  });

  it("serializes selected facts inside a labelled data boundary", () => {
    const context = buildAgentPlacementContext(makeSeed(), "placement_selected", "2026-09-08");
    const serialized = serializeAgentPlacementContext(context!);

    expect(serialized.startsWith("<F5_CONTEXT>\n")).toBe(true);
    expect(serialized.endsWith("\n</F5_CONTEXT>")).toBe(true);
    expect(serialized).toContain('"companyName": "Acme Co"');
    expect(serialized).not.toContain("Other Client");
    expect(serialized).not.toContain("issue_other");
  });

  it("rejects missing and archived placements", () => {
    const seed = makeSeed();
    seed.placements[0].archived = true;

    expect(buildAgentPlacementContext(seed, "placement_selected", "2026-09-08")).toBeNull();
    expect(buildAgentPlacementContext(seed, "missing", "2026-09-08")).toBeNull();
  });
});
