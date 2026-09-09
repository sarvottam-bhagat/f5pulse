import { describe, expect, it } from "vitest";
import { emptySeed } from "../../../store/__tests__/fixtures";
import { buildClientView } from "../clientView";
import { makeClient, makeEscalation, makeFeedback, makeIssue, makePlacement, makeProfessional, TODAY } from "./fixtures";

describe("client operational overview", () => {
  it("separates recorded feedback history from upcoming checkpoints", () => {
    const seed = emptySeed();
    seed.clients = [makeClient()];
    seed.professionals = [makeProfessional()];
    seed.placements = [makePlacement()];
    seed.feedback = [
      makeFeedback({ id: "recorded_old", scheduledFor: "2026-09-02", collectedAt: "2026-09-03T10:00:00.000Z", sentiment: "positive" }),
      makeFeedback({ id: "upcoming", scheduledFor: "2026-09-12" }),
      makeFeedback({ id: "recorded_new", scheduledFor: "2026-09-01", collectedAt: "2026-09-09T10:00:00.000Z", sentiment: "negative" }),
    ];

    const view = buildClientView(seed, "client_1", TODAY);

    expect(view?.completedFeedbackHistory.map((feedback) => feedback.id)).toEqual([
      "recorded_new",
      "recorded_old",
    ]);
    expect(view?.upcomingFeedback.map((feedback) => feedback.id)).toEqual(["upcoming"]);
  });

  it("attributes health, issues, and due feedback to the correct professional assignment", () => {
    const seed = emptySeed();
    seed.clients = [makeClient()];
    seed.professionals = [
      makeProfessional({ id: "pro_1", fullName: "Samuel Otieno" }),
      makeProfessional({ id: "pro_2", fullName: "Chidi Lopez", role: "Bookkeeper" }),
    ];
    seed.placements = [
      makePlacement({ id: "placement_1", professionalId: "pro_1", trialEndDate: "2026-08-31" }),
      makePlacement({ id: "placement_2", professionalId: "pro_2", roleTitle: "Bookkeeper", trialEndDate: "2026-09-20" }),
    ];
    seed.issues = [makeIssue({ id: "issue_1", placementId: "placement_1", severity: "high" })];
    seed.escalations = [makeEscalation({ placementId: "placement_1" })];
    seed.feedback = [
      makeFeedback({ id: "feedback_1", placementId: "placement_1", scheduledFor: "2026-09-04", collectedAt: "2026-09-04", sentiment: "positive" }),
      makeFeedback({ id: "feedback_2", placementId: "placement_2", scheduledFor: "2026-09-07" }),
    ];

    const view = buildClientView(seed, "client_1", TODAY) as ReturnType<typeof buildClientView> & {
      overallHealth?: string;
      stats?: { activeProfessionals: number; inTrial: number; openIssues: number; feedbackDue: number };
      assignments?: Array<{
        professional: { fullName: string };
        health: { state: string };
        openIssues: Array<{ id: string }>;
        feedbackDueCount: number;
      }>;
    };

    expect(view?.overallHealth).toBe("Critical");
    expect(view?.stats).toEqual({ activeProfessionals: 2, inTrial: 1, openIssues: 1, feedbackDue: 1 });
    expect(view?.assignments?.map((assignment) => ({
      name: assignment.professional.fullName,
      health: assignment.health.state,
      issues: assignment.openIssues.map((issue) => issue.id),
      feedbackDue: assignment.feedbackDueCount,
    }))).toEqual([
      { name: "Samuel Otieno", health: "Critical", issues: ["issue_1"], feedbackDue: 0 },
      { name: "Chidi Lopez", health: "Watch", issues: [], feedbackDue: 1 },
    ]);
  });
});
