import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { DetailAction } from "../../detail/DetailActionSheet";
import type { ClientAssignmentSummary } from "../../../domain/rules/clientView";
import { makePlacement, makeProfessional } from "../../../domain/rules/__tests__/fixtures";

type SectionProps = {
  assignments: ClientAssignmentSummary[];
  onAction: (action: DetailAction) => void;
};

describe("ClientPlacementsSection", () => {
  it("renders one placement link per professional without duplicate chat navigation", async () => {
    const importedSection = await import("../ClientPlacementsSection").catch(() => null);
    const Component = importedSection?.ClientPlacementsSection as ComponentType<SectionProps> | undefined;
    const assignments: ClientAssignmentSummary[] = [
      {
        placement: makePlacement({ id: "placement-1", professionalId: "pro-1" }),
        professional: makeProfessional({ id: "pro-1", fullName: "Samuel Otieno" }),
        health: { state: "Critical", reasons: ["Open escalation"] },
        openIssues: [],
        feedbackDueCount: 0,
        latestClientFeedback: null,
        nextClientFeedback: null,
      },
      {
        placement: makePlacement({ id: "placement-2", professionalId: "pro-2" }),
        professional: makeProfessional({ id: "pro-2", fullName: "Chidi Lopez" }),
        health: { state: "Healthy", reasons: ["No negative signals"] },
        openIssues: [],
        feedbackDueCount: 0,
        latestClientFeedback: null,
        nextClientFeedback: null,
      },
    ];

    expect(Component).toBeTypeOf("function");
    if (!Component) return;

    const html = renderToStaticMarkup(createElement(Component, { assignments, onAction: () => undefined }));
    expect(html.match(/View placement/g)).toHaveLength(2);
    expect(html).not.toContain(">Chat<");
  });
});
