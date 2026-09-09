import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import HomePage from "../page";

vi.mock("@/store/useStore", () => ({
  useStoreData: () => ({
    seed: {
      clients: [],
      professionals: [],
      placements: [],
      feedback: [],
      attendance: [],
      checkins: [],
      issues: [],
      followups: [],
      communications: [],
      escalations: [],
      auditLog: [],
    },
  }),
  useStore: () => ({}),
  useStorageMode: () => "persistent",
  useMalformedRecordCount: () => 0,
}));

describe("HomePage empty portfolio", () => {
  it("shows a clear empty state and a way to add the first placement", () => {
    const html = renderToStaticMarkup(<HomePage />);

    expect(html).toContain("No active placements yet");
    expect(html).toContain("Add your first placement to start monitoring");
    expect(html).toContain("Add Placement");
    expect(html).toContain('href="/placements/new"');
  });
});
