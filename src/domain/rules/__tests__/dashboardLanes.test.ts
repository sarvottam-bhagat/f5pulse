import { describe, expect, it } from "vitest";
import * as priorityRules from "../priority";
import type { PriorityCard } from "../priority";

function card(id: string, section: PriorityCard["section"]): PriorityCard {
  return {
    id,
    section,
    placementId: `placement-${id}`,
    clientName: `Client ${id}`,
    professionalName: `Professional ${id}`,
    contactWho: "client",
    reason: `Reason ${id}`,
    riskLevel: section === "escalate_now" ? "critical" : "medium",
    evidence: [],
    dueAt: "2026-09-09",
    recommendedAction: section === "escalate_now" ? "escalate" : "log_outcome",
    whyHere: `Why ${id}`,
    healthState: section === "escalate_now" ? "Critical" : "Watch",
  };
}

describe("buildDashboardLanes", () => {
  it("keeps immediate work together and separates the next three days", () => {
    const cards = [
      card("upcoming", "next_three_days"),
      card("contact", "contact_today"),
      card("fix", "confirm_fix_held"),
      card("escalation", "escalate_now"),
    ];

    const buildDashboardLanes = (
      priorityRules as typeof priorityRules & {
        buildDashboardLanes?: (items: PriorityCard[]) => {
          attention: PriorityCard[];
          upcoming: PriorityCard[];
        };
      }
    ).buildDashboardLanes;

    const result = buildDashboardLanes?.(cards) ?? null;

    expect(result).toEqual({
      attention: [cards[1], cards[2], cards[3]],
      upcoming: [cards[0]],
    });
  });

  it("moves to the lane that still has results when filtering empties the selected lane", () => {
    const resolveDashboardLane = (
      priorityRules as typeof priorityRules & {
        resolveDashboardLane?: (
          current: "attention" | "upcoming",
          attentionCount: number,
          upcomingCount: number,
        ) => "attention" | "upcoming";
      }
    ).resolveDashboardLane;

    expect(resolveDashboardLane?.("upcoming", 4, 0) ?? null).toBe("attention");
  });
});
