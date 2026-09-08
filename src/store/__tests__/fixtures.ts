import type { Seed } from "../../domain/types";

export function emptySeed(): Seed {
  return {
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
  };
}

export function seedWithClientAndProfessional(): Seed {
  const seed = emptySeed();
  return {
    ...seed,
    clients: [
      {
        id: "client_1",
        companyName: "Acme Co",
        industry: "SaaS",
        primaryContactName: "Jane Doe",
        contactTitle: "COO",
        email: "jane@acme.com",
        phone: "+1-555-555-5555",
        usTimeZone: "America/New_York",
        preferredChannel: "email",
        notes: "",
        archived: false,
        createdAt: "2026-01-01",
      },
    ],
    professionals: [
      {
        id: "pro_1",
        fullName: "Alex Rivera",
        role: "Customer Support Specialist",
        email: "alex@f5talent.example",
        phone: "+63-555-5555",
        country: "Philippines",
        timeZone: "Asia/Manila",
        workingHours: { start: "09:00", end: "17:00", timeZone: "Asia/Manila" },
        f5Manager: "Jamie Ortiz",
        notes: "",
        archived: false,
        createdAt: "2026-01-01",
      },
    ],
  };
}
