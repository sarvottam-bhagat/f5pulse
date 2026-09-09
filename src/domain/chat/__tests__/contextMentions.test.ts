import { describe, expect, it } from "vitest";
import { emptySeed, seedWithClientAndProfessional } from "@/store/__tests__/fixtures";
import type { Client, Placement, Professional } from "@/domain/types";
import {
  getClientMentionOptions,
  getProfessionalMentionOptions,
  readMentionToken,
} from "../contextMentions";

const secondClient: Client = {
  id: "client_2",
  companyName: "Beacon Health",
  industry: "Healthcare",
  primaryContactName: "Omar Shah",
  contactTitle: "COO",
  email: "omar@beacon.example",
  phone: "+1-555-2000",
  usTimeZone: "America/Chicago",
  preferredChannel: "email",
  notes: "",
  archived: false,
  createdAt: "2026-01-01",
};

const secondProfessional: Professional = {
  id: "pro_2",
  fullName: "Maya Chen",
  role: "Executive Assistant",
  email: "maya@f5talent.example",
  phone: "+63-555-2000",
  country: "Philippines",
  timeZone: "Asia/Manila",
  workingHours: { start: "09:00", end: "17:00", timeZone: "Asia/Manila" },
  f5Manager: "Jamie Ortiz",
  notes: "",
  archived: false,
  createdAt: "2026-01-01",
};

function placement(overrides: Partial<Placement> = {}): Placement {
  return {
    id: "placement_1",
    clientId: "client_1",
    professionalId: "pro_1",
    roleTitle: "Customer Support Specialist",
    startDate: "2026-01-01",
    trialEndDate: "2026-01-31",
    f5Owner: "Jamie Ortiz",
    expectedSchedule: "Mon-Fri",
    initialNotes: "",
    status: "Active",
    archived: false,
    createdAt: "2026-01-01",
    ...overrides,
  };
}

describe("chat context mentions", () => {
  it("lists searchable, unarchived clients for the @ menu", () => {
    const base = seedWithClientAndProfessional();
    const seed = {
      ...base,
      clients: [
        secondClient,
        base.clients[0],
        { ...secondClient, id: "client_archived", companyName: "Beacon Legacy", archived: true },
      ],
    };

    expect(getClientMentionOptions(seed, "acme").map((option) => option.label)).toEqual(["Acme Co"]);
    expect(getClientMentionOptions(seed, "").map((option) => option.label)).toEqual(["Acme Co", "Beacon Health"]);
  });

  it("lists only active professionals placed with the selected client for the / menu", () => {
    const base = seedWithClientAndProfessional();
    const seed = {
      ...base,
      clients: [...base.clients, secondClient],
      professionals: [...base.professionals, secondProfessional],
      placements: [
        placement(),
        placement({ id: "placement_2", clientId: "client_2", professionalId: "pro_2" }),
        placement({ id: "placement_ended", professionalId: "pro_2", status: "Ended" }),
      ],
    };

    expect(getProfessionalMentionOptions(seed, "client_1", "")).toEqual([
      {
        id: "pro_1",
        label: "Alex Rivera",
        secondary: "Customer Support Specialist",
        context: {
          placementId: "placement_1",
          clientId: "client_1",
          professionalId: "pro_1",
        },
      },
    ]);
  });

  it("filters professionals by name and role without leaking other clients", () => {
    const base = seedWithClientAndProfessional();
    const seed = {
      ...base,
      clients: [...base.clients, secondClient],
      professionals: [...base.professionals, secondProfessional],
      placements: [
        placement(),
        placement({ id: "placement_2", clientId: "client_2", professionalId: "pro_2" }),
      ],
    };

    expect(getProfessionalMentionOptions(seed, "client_1", "support").map((option) => option.label)).toEqual(["Alex Rivera"]);
    expect(getProfessionalMentionOptions(seed, "client_1", "maya")).toEqual([]);
    expect(getProfessionalMentionOptions(emptySeed(), "client_1", "")).toEqual([]);
  });

  it("recognizes the active @ or / token immediately before the cursor", () => {
    expect(readMentionToken("Please ask @blue", 16)).toEqual({ trigger: "@", query: "blue", start: 11, end: 16 });
    expect(readMentionToken("Review /sam today", 11)).toEqual({ trigger: "/", query: "sam", start: 7, end: 11 });
    expect(readMentionToken("email@example.com", 17)).toBeNull();
    expect(readMentionToken("plain message", 13)).toBeNull();
  });
});
