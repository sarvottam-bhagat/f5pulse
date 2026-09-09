import { describe, expect, it } from "vitest";
import { seedWithClientAndProfessional } from "@/store/__tests__/fixtures";
import type { Seed } from "@/domain/types";
import {
  buildAgentPortfolioContext,
  serializeAgentPortfolioContext,
} from "../portfolioContext";

function makeSeed(): Seed {
  const seed = seedWithClientAndProfessional();
  seed.placements = [{
    id: "placement-1",
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
    createdAt: "2026-07-20T00:00:00.000Z",
  }];
  seed.issues = [{
    id: "issue-1",
    placementId: "placement-1",
    source: "client_complaint",
    title: "Slow response",
    description: "Response SLA missed",
    severity: "high",
    status: "Investigating",
    followupWindows: [],
    recurrenceCount: 0,
    reportedAt: "2026-09-08T00:00:00.000Z",
    reopenedCount: 0,
    createdAt: "2026-09-08T00:00:00.000Z",
  }];
  seed.feedback = [{
    id: "feedback-1",
    placementId: "placement-1",
    subjectType: "client",
    scheduledFor: "2026-09-09",
    attemptCount: 0,
    isTrialCheckpoint: false,
    dayOffset: 30,
    createdAt: "2026-08-01T00:00:00.000Z",
  }];
  return seed;
}

describe("portfolio chat context", () => {
  it("summarizes all active operations using the dashboard rule outputs", () => {
    const context = buildAgentPortfolioContext(makeSeed(), "2026-09-09");

    expect(context.scope).toBe("portfolio");
    expect(context.summary).toMatchObject({
      activeClients: 1,
      activeProfessionals: 1,
      activePlacements: 1,
      clientsWithOpenIssues: 1,
      openIssues: 1,
    });
    expect(context.clients[0]).toMatchObject({
      companyName: "Acme Co",
      activeProfessionals: ["Alex Rivera"],
      openIssues: 1,
    });
    expect(context.dashboard.tiles.contacts_due_today).toBe(1);
    expect(context.contactsDueToday).toEqual([{
      client: "Acme Co",
      professional: "Alex Rivera",
      reasons: ["Client feedback checkpoint due 2026-09-09"],
    }]);
  });

  it("serializes portfolio facts inside the same labelled data boundary", () => {
    const serialized = serializeAgentPortfolioContext(
      buildAgentPortfolioContext(makeSeed(), "2026-09-09"),
    );

    expect(serialized.startsWith("<F5_CONTEXT>\n")).toBe(true);
    expect(serialized.endsWith("\n</F5_CONTEXT>")).toBe(true);
    expect(serialized).toContain('"scope": "portfolio"');
  });
});
