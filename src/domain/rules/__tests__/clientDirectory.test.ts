import { describe, expect, it } from "vitest";
import * as rules from "../index";
import { emptySeed } from "../../../store/__tests__/fixtures";
import type { Client, Placement } from "../../types";

const client = (id: string, companyName: string, archived = false): Client => ({
  id,
  companyName,
  industry: "Professional Services",
  primaryContactName: `${companyName} Contact`,
  contactTitle: "Operations Director",
  email: `${id}@example.com`,
  phone: "+1 555 0100",
  usTimeZone: "America/New_York",
  preferredChannel: "email",
  notes: "",
  archived,
  createdAt: "2026-01-01T00:00:00.000Z",
});

const placement = (id: string, clientId: string, status: Placement["status"], archived = false): Placement => ({
  id,
  clientId,
  professionalId: `pro-${id}`,
  roleTitle: "Customer Support Specialist",
  startDate: "2026-01-01",
  trialEndDate: "2026-02-01",
  f5Owner: "F5 Owner",
  expectedSchedule: "Mon–Fri",
  initialNotes: "",
  status,
  archived,
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("client directory rows", () => {
  it("counts only non-archived active placements and keeps archived clients visible for filtering", () => {
    const buildRows = (rules as typeof rules & {
      buildClientDirectoryRows?: (seed: ReturnType<typeof emptySeed>) => Array<{
        client: Client;
        activePlacementCount: number;
        totalPlacementCount: number;
      }>;
    }).buildClientDirectoryRows;

    expect(buildRows).toBeTypeOf("function");

    const seed = emptySeed();
    seed.clients = [client("client-b", "Bravo Group", true), client("client-a", "Acme Partners")];
    seed.placements = [
      placement("one", "client-a", "Active"),
      placement("two", "client-a", "Ended"),
      placement("three", "client-a", "Active", true),
      placement("four", "client-b", "Active"),
    ];

    expect(buildRows?.(seed)).toEqual([
      { client: seed.clients[1], activePlacementCount: 1, totalPlacementCount: 3 },
      { client: seed.clients[0], activePlacementCount: 1, totalPlacementCount: 1 },
    ]);
  });

  it("filters the directory by client details and archived status", () => {
    const filterRows = (rules as typeof rules & {
      filterClientDirectoryRows?: (
        rows: Array<{ client: Client; activePlacementCount: number; totalPlacementCount: number }>,
        query: string,
        status: "all" | "active" | "archived",
      ) => Array<{ client: Client }>;
    }).filterClientDirectoryRows;
    const rows = [
      { client: client("client-a", "Acme Partners"), activePlacementCount: 2, totalPlacementCount: 2 },
      { client: { ...client("client-b", "Bravo Group", true), primaryContactName: "Jordan Lee" }, activePlacementCount: 0, totalPlacementCount: 1 },
    ];

    expect(filterRows).toBeTypeOf("function");
    expect(filterRows?.(rows, "jordan", "archived").map((row) => row.client.id)).toEqual(["client-b"]);
    expect(filterRows?.(rows, "partners", "active").map((row) => row.client.id)).toEqual(["client-a"]);
    expect(filterRows?.(rows, "jordan", "active")).toEqual([]);
  });
});
