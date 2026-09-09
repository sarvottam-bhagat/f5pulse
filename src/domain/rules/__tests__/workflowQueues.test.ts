import { describe, expect, it } from "vitest";
import { buildEscalationTracker, buildFollowupQueue } from "../workflowQueues";
import { makeContext, makeEscalation } from "./fixtures";

describe("buildFollowupQueue", () => {
  it("returns only incomplete follow-ups in due-date order", () => {
    const context = makeContext({
      followups: [
        {
          id: "future",
          placementId: "placement_1",
          dueDate: "2026-09-12",
          description: "Future follow-up",
          owner: "Karan",
          createdAt: "2026-09-01",
        },
        {
          id: "completed",
          placementId: "placement_1",
          dueDate: "2026-09-07",
          description: "Already completed",
          owner: "Karan",
          completedAt: "2026-09-07T12:00:00.000Z",
          outcome: "Done",
          createdAt: "2026-09-01",
        },
        {
          id: "overdue",
          placementId: "placement_1",
          dueDate: "2026-09-06",
          description: "Overdue follow-up",
          owner: "Karan",
          createdAt: "2026-09-01",
        },
      ],
    });

    const queue = buildFollowupQueue([context], "2026-09-08");

    expect(queue.map((item) => item.followupId)).toEqual(["overdue", "future"]);
    expect(queue.map((item) => item.timing)).toEqual(["overdue", "upcoming"]);
    expect(queue[0]).toEqual(
      expect.objectContaining({ clientName: "Test Co", professionalName: "Alex Rivera" }),
    );
  });
});

describe("buildEscalationTracker", () => {
  it("keeps resolved escalations visible after active escalations", () => {
    const context = makeContext({
      escalations: [
        makeEscalation({ id: "resolved", status: "resolved", raisedBy: "Karan", resolvedAt: "2026-09-08T12:00:00.000Z" }),
        makeEscalation({ id: "open", status: "open", raisedBy: "Karan", escalatedTo: "Ankita", raisedAt: "2026-09-08T09:00:00.000Z" }),
        makeEscalation({ id: "seed-trigger", status: "open", raisedBy: undefined }),
      ],
    });

    const tracker = buildEscalationTracker([context]);

    expect(tracker.map((item) => item.escalationId)).toEqual(["open", "resolved"]);
    expect(tracker[0]).toEqual(
      expect.objectContaining({ status: "open", raisedBy: "Karan", escalatedTo: "Ankita" }),
    );
  });
});
