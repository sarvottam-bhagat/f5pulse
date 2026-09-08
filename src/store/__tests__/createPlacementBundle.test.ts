import { describe, it, expect } from "vitest";
import { createPlacementBundle } from "../mutations";
import { emptySeed, seedWithClientAndProfessional } from "./fixtures";
import type { CreatePlacementBundleInput } from "../types";

const NOW = "2026-09-08T12:00:00.000Z";

const basePlacementInput: CreatePlacementBundleInput["placement"] = {
  roleTitle: "Customer Support Specialist",
  startDate: "2026-09-08",
  trialEndDate: "2026-10-08",
  f5Owner: "Jamie Ortiz",
  expectedSchedule: "Mon-Fri 9-5 EST",
  initialNotes: "",
  status: "Active",
};

describe("createPlacementBundle", () => {
  it("creates a new client + new professional + placement atomically", () => {
    const seed = emptySeed();
    const input: CreatePlacementBundleInput = {
      client: {
        mode: "new",
        data: {
          companyName: "Brand New Co",
          industry: "Retail",
          primaryContactName: "Sam Lee",
          contactTitle: "Ops Manager",
          email: "sam@brandnew.com",
          phone: "+1-555-000-0000",
          usTimeZone: "America/Chicago",
          preferredChannel: "email",
        },
      },
      professional: {
        mode: "new",
        data: {
          fullName: "Nora Kim",
          role: "Bookkeeper",
          email: "nora@f5talent.example",
          phone: "+1-555-111-1111",
          country: "Mexico",
          timeZone: "America/Mexico_City",
          workingHours: { start: "09:00", end: "17:00", timeZone: "America/Mexico_City" },
          f5Manager: "Taylor Brooks",
        },
      },
      placement: basePlacementInput,
    };

    const result = createPlacementBundle(seed, input, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.seed.clients).toHaveLength(1);
    expect(result.value.seed.professionals).toHaveLength(1);
    expect(result.value.seed.placements).toHaveLength(1);
    expect(result.value.result.client.companyName).toBe("Brand New Co");
    expect(result.value.result.professional.fullName).toBe("Nora Kim");
  });

  it("supports existing client + new professional", () => {
    const seed = seedWithClientAndProfessional();
    const input: CreatePlacementBundleInput = {
      client: { mode: "existing", clientId: "client_1" },
      professional: {
        mode: "new",
        data: {
          fullName: "New Pro",
          role: "Bookkeeper",
          email: "newpro@f5talent.example",
          phone: "+1-555-222-2222",
          country: "Colombia",
          timeZone: "America/Bogota",
          workingHours: { start: "09:00", end: "17:00", timeZone: "America/Bogota" },
          f5Manager: "Taylor Brooks",
        },
      },
      placement: basePlacementInput,
    };
    const result = createPlacementBundle(seed, input, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.seed.clients).toHaveLength(1); // no new client created
    expect(result.value.seed.professionals).toHaveLength(2); // pro_1 + New Pro
  });

  it("supports existing client + existing available professional", () => {
    const seed = seedWithClientAndProfessional();
    const input: CreatePlacementBundleInput = {
      client: { mode: "existing", clientId: "client_1" },
      professional: { mode: "existing", professionalId: "pro_1" },
      placement: basePlacementInput,
    };
    const result = createPlacementBundle(seed, input, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.seed.placements).toHaveLength(1);
    expect(result.value.seed.placements[0].professionalId).toBe("pro_1");
  });

  it("rejects a professional who already has an active placement", () => {
    const seed = seedWithClientAndProfessional();
    const withActivePlacement = {
      ...seed,
      placements: [
        {
          id: "existing_placement",
          clientId: "client_1",
          professionalId: "pro_1",
          roleTitle: "Customer Support Specialist",
          startDate: "2026-08-01",
          trialEndDate: "2026-08-31",
          f5Owner: "Jamie Ortiz",
          expectedSchedule: "Mon-Fri",
          initialNotes: "",
          status: "Active" as const,
          archived: false,
          createdAt: "2026-08-01",
        },
      ],
    };
    const input: CreatePlacementBundleInput = {
      client: { mode: "existing", clientId: "client_1" },
      professional: { mode: "existing", professionalId: "pro_1" },
      placement: basePlacementInput,
    };
    const result = createPlacementBundle(withActivePlacement, input, NOW);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/already has an active placement/i);
  });

  it("does not mutate the original seed object (safe to discard on cancel)", () => {
    const seed = seedWithClientAndProfessional();
    const originalClientCount = seed.clients.length;
    const originalPlacementCount = seed.placements.length;
    const input: CreatePlacementBundleInput = {
      client: { mode: "existing", clientId: "client_1" },
      professional: { mode: "existing", professionalId: "pro_1" },
      placement: basePlacementInput,
    };
    createPlacementBundle(seed, input, NOW);
    // original seed reference is untouched — caller only commits by using the returned seed
    expect(seed.clients.length).toBe(originalClientCount);
    expect(seed.placements.length).toBe(originalPlacementCount);
  });

  it("generates trial feedback checkpoints at days 2, 7, 14, 21, 30", () => {
    const seed = seedWithClientAndProfessional();
    const input: CreatePlacementBundleInput = {
      client: { mode: "existing", clientId: "client_1" },
      professional: { mode: "existing", professionalId: "pro_1" },
      placement: basePlacementInput,
    };
    const result = createPlacementBundle(seed, input, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const dayOffsets = result.value.seed.feedback
      .filter((f) => f.placementId === result.value.result.placement.id)
      .map((f) => f.dayOffset)
      .sort((a, b) => a - b);
    expect(dayOffsets).toEqual([2, 7, 14, 21, 30]);
  });

  it("generates professional check-ins at days 3, 10, 21, 30 plus post-trial lookahead", () => {
    const seed = seedWithClientAndProfessional();
    const input: CreatePlacementBundleInput = {
      client: { mode: "existing", clientId: "client_1" },
      professional: { mode: "existing", professionalId: "pro_1" },
      placement: basePlacementInput,
    };
    const result = createPlacementBundle(seed, input, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const trialCheckins = result.value.seed.checkins
      .filter((c) => c.placementId === result.value.result.placement.id && c.isTrialCheckpoint)
      .map((c) => c.dayOffset)
      .sort((a, b) => a - b);
    expect(trialCheckins).toEqual([3, 10, 21, 30]);
  });

  it("adds a creation entry to the audit timeline", () => {
    const seed = seedWithClientAndProfessional();
    const input: CreatePlacementBundleInput = {
      client: { mode: "existing", clientId: "client_1" },
      professional: { mode: "existing", professionalId: "pro_1" },
      placement: basePlacementInput,
    };
    const result = createPlacementBundle(seed, input, NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.seed.auditLog.some((a) => a.action === "placement_created")).toBe(true);
  });

  it("rejects when the referenced existing client does not exist", () => {
    const seed = seedWithClientAndProfessional();
    const input: CreatePlacementBundleInput = {
      client: { mode: "existing", clientId: "does_not_exist" },
      professional: { mode: "existing", professionalId: "pro_1" },
      placement: basePlacementInput,
    };
    const result = createPlacementBundle(seed, input, NOW);
    expect(result.ok).toBe(false);
  });
});
