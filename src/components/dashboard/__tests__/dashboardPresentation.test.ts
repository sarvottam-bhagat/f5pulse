import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BottomNav } from "@/components/layout/BottomNav";
import { SummaryTiles } from "@/components/dashboard/SummaryTiles";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { PriorityCardView } from "@/components/dashboard/PriorityCardView";
import type { SummaryTile } from "@/domain/rules";
import type { PriorityCard } from "@/domain/rules";

let pathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

const tiles: SummaryTile[] = [
  { key: "contacts_due_today", label: "Contacts due today", count: 2 },
  { key: "escalations", label: "Escalations", count: 4 },
  { key: "trial_placements", label: "Trial placements", count: 7 },
  { key: "silent_clients", label: "Silent clients", count: 1 },
  { key: "overdue_checkins", label: "Overdue check-ins", count: 3 },
  { key: "fixes_awaiting_confirmation", label: "Fixes awaiting confirmation", count: 0 },
];

describe("dashboard presentation", () => {
  beforeEach(() => {
    pathname = "/";
  });

  it("renders the primary navigation as a top floating control without emoji labels", () => {
    const html = renderToStaticMarkup(createElement(BottomNav));

    expect(html).toContain('aria-label="Primary navigation"');
    expect(html).toContain("fixed top-4");
    expect(html).not.toContain("🏠");
    expect(html).not.toContain("💬");
  });

  it("separates the three primary metrics from the three supporting signals", () => {
    const html = renderToStaticMarkup(
      createElement(SummaryTiles, {
        tiles,
        portfolioTotals: { clients: 13, professionals: 40 },
        activeFilter: null,
        onToggleFilter: () => undefined,
      }),
    );

    expect(html).toContain('aria-label="Portfolio totals"');
    expect(html).toContain("Total clients");
    expect(html).toContain("Total professionals");
    expect(html).toContain(">13<");
    expect(html).toContain(">40<");
    expect(html).toContain('aria-label="Primary metrics"');
    expect(html).toContain('aria-label="Status signals"');
    expect((html.match(/<button/g) ?? []).length).toBe(6);
  });

  it("keeps supporting dashboard insights to two decision-focused cards", () => {
    const html = renderToStaticMarkup(
      createElement(InsightsSection, { contexts: [], today: "2026-09-09" }),
    );

    expect((html.match(/rounded-\[28px\]/g) ?? []).length).toBe(2);
    expect(html).toContain("Trial radar");
    expect(html).toContain("Issue pipeline");
  });

  it("renders priority work as a compact accessible list row", () => {
    const priorityCard: PriorityCard = {
      id: "priority-1",
      section: "contact_today",
      placementId: "placement-1",
      clientName: "Harborview",
      professionalName: "Priya Shah",
      contactWho: "client",
      reason: "Feedback checkpoint is overdue",
      riskLevel: "high",
      evidence: ["Two unanswered attempts"],
      dueAt: "2026-09-09",
      recommendedAction: "log_outcome",
      whyHere: "The client needs a response today.",
      healthState: "At Risk",
    };

    const html = renderToStaticMarkup(
      createElement(PriorityCardView, { card: priorityCard, onPrimaryAction: () => undefined }),
    );

    expect(html).toContain('role="listitem"');
    expect(html).toContain("Feedback checkpoint is overdue");
    expect(html).not.toContain("<details");
  });
});
