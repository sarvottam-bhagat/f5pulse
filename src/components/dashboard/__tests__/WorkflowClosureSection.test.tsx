import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { WorkflowClosureSection } from "../WorkflowClosureSection";
import type { EscalationTrackerItem, FollowupQueueItem } from "@/domain/rules";

const FOLLOWUP: FollowupQueueItem = {
  followupId: "followup_1",
  placementId: "placement_1",
  clientName: "Acme Co",
  professionalName: "Alex Rivera",
  dueDate: "2026-09-08",
  description: "Follow up with Ankita on escalation",
  owner: "Karan",
  timing: "today",
};

function escalation(status: EscalationTrackerItem["status"]): EscalationTrackerItem {
  return {
    escalationId: `escalation_${status}`,
    placementId: "placement_1",
    clientName: "Acme Co",
    professionalName: "Alex Rivera",
    summary: "Client needs senior support.",
    status,
    raisedBy: "Karan",
    escalatedTo: "Ankita",
    raisedAt: "2026-09-08T09:00:00.000Z",
  };
}

describe("WorkflowClosureSection", () => {
  it("renders an actionable follow-up with ownership and timing", () => {
    const html = renderToStaticMarkup(
      <WorkflowClosureSection
        followups={[FOLLOWUP]}
        escalations={[]}
        onCompleteFollowup={vi.fn()}
        onUpdateEscalation={vi.fn()}
      />,
    );

    expect(html).toContain("Follow-up queue");
    expect(html).toContain("Follow up with Ankita on escalation");
    expect(html).toContain("Due today");
    expect(html).toContain("Complete");
  });

  it("shows only the valid next escalation action for each lifecycle state", () => {
    const html = renderToStaticMarkup(
      <WorkflowClosureSection
        followups={[]}
        escalations={[escalation("open"), escalation("acknowledged"), escalation("resolved")]}
        onCompleteFollowup={vi.fn()}
        onUpdateEscalation={vi.fn()}
      />,
    );

    expect(html).toContain("Escalation tracking");
    expect(html).toContain("Awaiting Ankita");
    expect(html).toContain("Acknowledged by Ankita");
    expect(html).toContain("Resolved");
    expect(html.match(/Mark acknowledged/g)).toHaveLength(1);
    expect(html.match(/Resolve/g)).toHaveLength(2);
  });
});
