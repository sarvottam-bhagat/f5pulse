import { describe, it, expect } from "vitest";
import { buildPriorityQueue, groupBySection } from "../priority";
import {
  makeContext,
  makeFeedback,
  makeIssue,
  makeEscalation,
  makeCheckin,
  TODAY,
} from "./fixtures";

describe("buildPriorityQueue — ordering and bucketing", () => {
  it("places an open escalation in escalate_now and nowhere else for that placement", () => {
    const ctx = makeContext({
      escalations: [makeEscalation({ status: "open" })],
      feedback: [makeFeedback({ scheduledFor: "2026-09-01", attemptCount: 2 })], // would also be contact_today
    });
    const cards = buildPriorityQueue([ctx], TODAY);
    const sections = new Set(cards.map((c) => c.section));
    expect(sections.has("escalate_now")).toBe(true);
    expect(sections.has("contact_today")).toBe(false);
  });

  it("places a due follow-up confirmation window in confirm_fix_held", () => {
    const ctx = makeContext({
      issues: [
        makeIssue({
          status: "Monitoring",
          fixImplementedAt: "2026-09-06T00:00:00.000Z",
          fixDescription: "Fixed it",
          followupWindows: [{ id: "w1", dueAt: "2026-09-07T00:00:00.000Z", windowLabel: "24h" }],
        }),
      ],
    });
    const cards = buildPriorityQueue([ctx], TODAY);
    const grouped = groupBySection(cards);
    expect(grouped.confirm_fix_held.length).toBeGreaterThan(0);
    expect(grouped.confirm_fix_held[0].recommendedAction).toBe("confirm_fix");
  });

  it("places overdue client feedback in contact_today", () => {
    const ctx = makeContext({
      feedback: [makeFeedback({ scheduledFor: "2026-09-05", attemptCount: 0 })],
    });
    const cards = buildPriorityQueue([ctx], TODAY);
    const grouped = groupBySection(cards);
    expect(grouped.contact_today.length).toBeGreaterThan(0);
  });

  it("places an overdue professional check-in in contact_today", () => {
    const ctx = makeContext({
      checkins: [makeCheckin({ status: "scheduled", dueDate: "2026-09-01" })],
    });
    const cards = buildPriorityQueue([ctx], TODAY);
    const grouped = groupBySection(cards);
    expect(grouped.contact_today.some((c) => c.contactWho === "professional")).toBe(true);
  });

  it("places an upcoming (not yet due) checkpoint within 3 days in next_three_days", () => {
    const ctx = makeContext({
      feedback: [makeFeedback({ scheduledFor: "2026-09-10", attemptCount: 0 })], // 2 days out
    });
    const cards = buildPriorityQueue([ctx], TODAY);
    const grouped = groupBySection(cards);
    expect(grouped.next_three_days.length).toBeGreaterThan(0);
  });

  it("does not place a checkpoint more than 3 days out in next_three_days", () => {
    const ctx = makeContext({
      feedback: [makeFeedback({ scheduledFor: "2026-09-20", attemptCount: 0 })],
    });
    const cards = buildPriorityQueue([ctx], TODAY);
    const grouped = groupBySection(cards);
    expect(grouped.next_three_days.length).toBe(0);
  });

  it("sorts escalate_now before contact_today before confirm_fix_held before next_three_days", () => {
    const escalatingCtx = makeContext({
      placement: { id: "placement_a" },
      escalations: [makeEscalation({ placementId: "placement_a", status: "open" })],
    });
    const contactCtx = makeContext({
      placement: { id: "placement_b" },
      feedback: [makeFeedback({ placementId: "placement_b", scheduledFor: "2026-09-05", attemptCount: 0 })],
    });
    const upcomingCtx = makeContext({
      placement: { id: "placement_c" },
      feedback: [makeFeedback({ placementId: "placement_c", scheduledFor: "2026-09-10", attemptCount: 0 })],
    });
    const cards = buildPriorityQueue([upcomingCtx, contactCtx, escalatingCtx], TODAY);
    const sectionSequence = cards.map((c) => c.section);
    const firstEscalate = sectionSequence.indexOf("escalate_now");
    const firstContact = sectionSequence.indexOf("contact_today");
    const firstUpcoming = sectionSequence.indexOf("next_three_days");
    expect(firstEscalate).toBeLessThan(firstContact);
    expect(firstContact).toBeLessThan(firstUpcoming);
  });

  it("every card carries a non-empty 'why this is here' explanation", () => {
    const ctx = makeContext({
      escalations: [makeEscalation({ status: "open" })],
    });
    const cards = buildPriorityQueue([ctx], TODAY);
    for (const card of cards) {
      expect(card.whyHere.length).toBeGreaterThan(0);
    }
  });
});
