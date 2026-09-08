import { describe, it, expect } from "vitest";
import { buildSummaryTiles, filterByTile, trialPlacementPredicate } from "../summary";
import { makeContext, makeFeedback, makeEscalation, TODAY } from "./fixtures";

describe("summary tiles", () => {
  it("counts trial placements correctly using the placement's real trial end date", () => {
    const inTrial = makeContext({
      placement: { id: "p1", trialEndDate: "2026-10-01" },
    });
    const pastTrial = makeContext({
      placement: { id: "p2", trialEndDate: "2026-08-01" },
    });
    expect(trialPlacementPredicate(inTrial, TODAY)).toBe(true);
    expect(trialPlacementPredicate(pastTrial, TODAY)).toBe(false);
  });

  it("counts escalations tile from open escalations only", () => {
    const withOpen = makeContext({
      placement: { id: "p1" },
      escalations: [makeEscalation({ placementId: "p1", status: "open" })],
    });
    const withResolved = makeContext({
      placement: { id: "p2" },
      escalations: [makeEscalation({ placementId: "p2", status: "resolved" })],
    });
    const tiles = buildSummaryTiles([withOpen, withResolved], TODAY);
    const escalationsTile = tiles.find((t) => t.key === "escalations")!;
    expect(escalationsTile.count).toBe(1);
  });

  it("each tile acts as a filter returning a subset of contexts", () => {
    const silent = makeContext({
      placement: { id: "p1" },
      feedback: [makeFeedback({ placementId: "p1", scheduledFor: "2026-09-01", attemptCount: 2 })],
    });
    const healthy = makeContext({ placement: { id: "p2" } });
    const filtered = filterByTile([silent, healthy], "silent_clients", TODAY);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].placement.id).toBe("p1");
  });
});
