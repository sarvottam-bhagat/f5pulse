// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { Store } from "../Store";
import type { CreatePlacementBundleInput } from "../types";

const basePlacementInput: CreatePlacementBundleInput["placement"] = {
  roleTitle: "Customer Support Specialist",
  startDate: "2026-09-08",
  trialEndDate: "2026-10-08",
  f5Owner: "Jamie Ortiz",
  expectedSchedule: "Mon-Fri 9-5 EST",
  initialNotes: "",
  status: "Active",
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("Store — creation flow scenarios", () => {
  it("new client + new professional + placement creates all three records atomically", () => {
    const store = new Store();
    const before = store.getSeed();
    const result = store.createPlacementBundle({
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
    });

    expect(result.ok).toBe(true);
    const after = store.getSeed();
    expect(after.clients.length).toBe(before.clients.length + 1);
    expect(after.professionals.length).toBe(before.professionals.length + 1);
    expect(after.placements.length).toBe(before.placements.length + 1);
  });

  it("existing client + new professional creates only the professional and placement", () => {
    const store = new Store();
    const existingClientId = store.getSeed().clients[0].id;
    const before = store.getSeed();

    const result = store.createPlacementBundle({
      client: { mode: "existing", clientId: existingClientId },
      professional: {
        mode: "new",
        data: {
          fullName: "New Pro Test",
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
    });

    expect(result.ok).toBe(true);
    const after = store.getSeed();
    expect(after.clients.length).toBe(before.clients.length);
    expect(after.professionals.length).toBe(before.professionals.length + 1);
  });

  it("existing client + existing available professional creates only the placement", () => {
    const store = new Store();
    const seed = store.getSeed();
    const existingClientId = seed.clients[0].id;
    const activeProfessionalIds = new Set(
      seed.placements.filter((p) => p.status === "Active" && !p.archived).map((p) => p.professionalId),
    );
    const unassignedProfessional = seed.professionals.find((p) => !activeProfessionalIds.has(p.id));
    expect(unassignedProfessional).toBeDefined();

    const before = store.getSeed();
    const result = store.createPlacementBundle({
      client: { mode: "existing", clientId: existingClientId },
      professional: { mode: "existing", professionalId: unassignedProfessional!.id },
      placement: basePlacementInput,
    });

    expect(result.ok).toBe(true);
    const after = store.getSeed();
    expect(after.clients.length).toBe(before.clients.length);
    expect(after.professionals.length).toBe(before.professionals.length);
    expect(after.placements.length).toBe(before.placements.length + 1);
  });

  it("rejects a duplicate active professional and leaves state unchanged", () => {
    const store = new Store();
    const seed = store.getSeed();
    const activePlacement = seed.placements.find((p) => p.status === "Active" && !p.archived)!;
    const before = store.getSeed();

    const result = store.createPlacementBundle({
      client: { mode: "existing", clientId: activePlacement.clientId },
      professional: { mode: "existing", professionalId: activePlacement.professionalId },
      placement: basePlacementInput,
    });

    expect(result.ok).toBe(false);
    const after = store.getSeed();
    expect(after.placements.length).toBe(before.placements.length);
  });

  it("generates automatic trial checkpoints and adds an audit entry on creation", () => {
    const store = new Store();
    const seed = store.getSeed();
    const existingClientId = seed.clients[0].id;
    const activeProfessionalIds = new Set(
      seed.placements.filter((p) => p.status === "Active" && !p.archived).map((p) => p.professionalId),
    );
    const unassignedProfessional = seed.professionals.find((p) => !activeProfessionalIds.has(p.id))!;

    const result = store.createPlacementBundle({
      client: { mode: "existing", clientId: existingClientId },
      professional: { mode: "existing", professionalId: unassignedProfessional.id },
      placement: basePlacementInput,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const after = store.getSeed();
    const placementId = result.value.placement.id;
    expect(after.feedback.filter((f) => f.placementId === placementId).length).toBeGreaterThan(0);
    expect(after.checkins.filter((c) => c.placementId === placementId).length).toBeGreaterThan(0);
    expect(after.auditLog.some((a) => a.placementId === placementId && a.action === "placement_created")).toBe(true);
  });

  it("persists mutations across a simulated refresh (new Store instance reads localStorage)", () => {
    const store1 = new Store();
    const seed = store1.getSeed();
    const existingClientId = seed.clients[0].id;
    const activeProfessionalIds = new Set(
      seed.placements.filter((p) => p.status === "Active" && !p.archived).map((p) => p.professionalId),
    );
    const unassignedProfessional = seed.professionals.find((p) => !activeProfessionalIds.has(p.id))!;

    const before = store1.getSeed().placements.length;
    store1.createPlacementBundle({
      client: { mode: "existing", clientId: existingClientId },
      professional: { mode: "existing", professionalId: unassignedProfessional.id },
      placement: basePlacementInput,
    });

    // Simulate a page refresh: construct a brand new Store, which reads from localStorage.
    const store2 = new Store();
    expect(store2.getSeed().placements.length).toBe(before + 1);
  });

  it("resetDemoData restores the original seed and clears localStorage", () => {
    const store = new Store();
    const seed = store.getSeed();
    const existingClientId = seed.clients[0].id;
    const activeProfessionalIds = new Set(
      seed.placements.filter((p) => p.status === "Active" && !p.archived).map((p) => p.professionalId),
    );
    const unassignedProfessional = seed.professionals.find((p) => !activeProfessionalIds.has(p.id))!;
    const originalCount = store.getSeed().placements.length;

    store.createPlacementBundle({
      client: { mode: "existing", clientId: existingClientId },
      professional: { mode: "existing", professionalId: unassignedProfessional.id },
      placement: basePlacementInput,
    });
    expect(store.getSeed().placements.length).toBe(originalCount + 1);

    store.resetDemoData();
    expect(store.getSeed().placements.length).toBe(originalCount);
  });

  it("notifies subscribers immediately after a mutation (for dashboard recalculation)", () => {
    const store = new Store();
    let notified = false;
    const unsubscribe = store.subscribe(() => {
      notified = true;
    });

    const seed = store.getSeed();
    const existingClientId = seed.clients[0].id;
    const activeProfessionalIds = new Set(
      seed.placements.filter((p) => p.status === "Active" && !p.archived).map((p) => p.professionalId),
    );
    const unassignedProfessional = seed.professionals.find((p) => !activeProfessionalIds.has(p.id))!;

    store.createPlacementBundle({
      client: { mode: "existing", clientId: existingClientId },
      professional: { mode: "existing", professionalId: unassignedProfessional.id },
      placement: basePlacementInput,
    });

    expect(notified).toBe(true);
    unsubscribe();
  });
});
