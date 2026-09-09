import { describe, expect, it } from "vitest";
import type { ChatMessage, ChatSession } from "@/domain/chat/types";
import type { Seed } from "@/domain/types";
import { seedWithClientAndProfessional } from "@/store/__tests__/fixtures";
import {
  createChatTurnHandler,
  type AuthenticatedChatScope,
  type ChatRepositoryPort,
} from "../chatTurnHandler";

function makeSeed(): Seed {
  const seed = seedWithClientAndProfessional();
  seed.placements = [{
    id: "placement-1",
    clientId: "client_1",
    professionalId: "pro_1",
    roleTitle: "Customer Support Specialist",
    startDate: "2026-08-01",
    trialEndDate: "2026-08-31",
    f5Owner: "Jamie Ortiz",
    expectedSchedule: "Mon-Fri",
    initialNotes: "",
    status: "Active",
    archived: false,
    createdAt: "2026-07-20T00:00:00.000Z",
  }];
  return seed;
}

function createFakeRepository() {
  const sessions: ChatSession[] = [];
  const messages = new Map<string, ChatMessage[]>();
  let sessionNumber = 0;
  let messageNumber = 0;

  const repository: ChatRepositoryPort = {
    async getSession(sessionId) {
      return sessions.find((session) => session.id === sessionId) ?? null;
    },
    async createSession(input) {
      const created: ChatSession = {
        id: `session-${++sessionNumber}`,
        title: input.title,
        context: input.context,
        viewMode: "client",
        messages: [],
        createdAt: "2026-09-09T08:00:00.000Z",
        updatedAt: "2026-09-09T08:00:00.000Z",
      };
      sessions.push(created);
      messages.set(created.id, []);
      return created;
    },
    async listMessages(sessionId) {
      return messages.get(sessionId) ?? [];
    },
    async createMessage(input) {
      const created: ChatMessage = {
        id: `message-${++messageNumber}`,
        role: input.role,
        content: input.content,
        status: input.status,
        metadata: input.metadata,
        isFallback: input.metadata?.fallback === true,
        createdAt: `2026-09-09T08:0${messageNumber}:00.000Z`,
      };
      messages.set(input.sessionId, [...(messages.get(input.sessionId) ?? []), created]);
      return created;
    },
    async touchSession(sessionId, updatedAt) {
      const session = sessions.find((item) => item.id === sessionId);
      if (session) session.updatedAt = updatedAt;
    },
  };

  return { repository, sessions, messages };
}

function authenticated(repository: ChatRepositoryPort): AuthenticatedChatScope {
  return { userId: "user-1", repository };
}

describe("createChatTurnHandler", () => {
  it("rejects missing bearer identity before persistence", async () => {
    const fake = createFakeRepository();
    const handler = createChatTurnHandler({
      authenticate: async () => null,
      runAgent: async () => "unused",
      now: () => "2026-09-09T08:00:00.000Z",
    });

    const result = await handler({ accessToken: null, placementId: "placement-1", userMessage: "Hello", seed: makeSeed() });

    expect(result).toEqual({ ok: false, status: 401, message: "Please reconnect your private chat session." });
    expect(fake.sessions).toHaveLength(0);
  });

  it("creates a placement-bound session and persists both sides of the turn", async () => {
    const fake = createFakeRepository();
    const handler = createChatTurnHandler({
      authenticate: async () => authenticated(fake.repository),
      runAgent: async ({ input }) => input.at(-1)?.content === "Why critical?" ? "An escalation is open." : "wrong",
      now: () => "2026-09-09T08:05:00.000Z",
    });

    const result = await handler({ accessToken: "token", placementId: "placement-1", userMessage: "Why critical?", seed: makeSeed() });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.session.context).toEqual({ placementId: "placement-1", clientId: "client_1", professionalId: "pro_1" });
    expect(result.userMessage).toMatchObject({ role: "user", content: "Why critical?", status: "complete" });
    expect(result.assistantMessage).toMatchObject({ role: "assistant", content: "An escalation is open.", status: "complete" });
    expect(fake.messages.get(result.session.id)).toHaveLength(2);
  });

  it("continues an owned session using its stored placement", async () => {
    const fake = createFakeRepository();
    const existing = await fake.repository.createSession({
      title: "Existing",
      context: { placementId: "placement-1", clientId: "client_1", professionalId: "pro_1" },
    });
    const handler = createChatTurnHandler({
      authenticate: async () => authenticated(fake.repository),
      runAgent: async () => "Stored placement used.",
      now: () => "2026-09-09T08:05:00.000Z",
    });

    const result = await handler({ accessToken: "token", sessionId: existing.id, placementId: "replacement-from-browser", userMessage: "Continue", seed: makeSeed() });

    expect(result.ok && result.session.context.placementId).toBe("placement-1");
  });

  it("returns not found for an inaccessible session", async () => {
    const fake = createFakeRepository();
    const handler = createChatTurnHandler({
      authenticate: async () => authenticated(fake.repository),
      runAgent: async () => "unused",
      now: () => "2026-09-09T08:05:00.000Z",
    });

    expect(await handler({ accessToken: "token", sessionId: "foreign", userMessage: "Continue", seed: makeSeed() }))
      .toEqual({ ok: false, status: 404, message: "This conversation is no longer available." });
  });

  it("rejects an ended placement before creating a session", async () => {
    const fake = createFakeRepository();
    const seed = makeSeed();
    seed.placements[0].status = "Ended";
    const handler = createChatTurnHandler({
      authenticate: async () => authenticated(fake.repository),
      runAgent: async () => "unused",
      now: () => "2026-09-09T08:05:00.000Z",
    });

    expect(await handler({ accessToken: "token", placementId: "placement-1", userMessage: "Hello", seed }))
      .toEqual({ ok: false, status: 400, message: "Choose an active professional before sending a message." });
    expect(fake.sessions).toHaveLength(0);
  });

  it("persists a failed deterministic fallback when OpenAI fails", async () => {
    const fake = createFakeRepository();
    const handler = createChatTurnHandler({
      authenticate: async () => authenticated(fake.repository),
      runAgent: async () => { throw new Error("OpenAI unavailable"); },
      now: () => "2026-09-09T08:05:00.000Z",
    });

    const result = await handler({ accessToken: "token", placementId: "placement-1", userMessage: "Summarize", seed: makeSeed() });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.assistantMessage).toMatchObject({
      role: "assistant",
      status: "failed",
      metadata: { fallback: true },
      isFallback: true,
    });
    expect(result.assistantMessage.content).toContain("Acme Co × Alex Rivera");
  });

  it("rejects empty and oversized input before persistence", async () => {
    const fake = createFakeRepository();
    const handler = createChatTurnHandler({
      authenticate: async () => authenticated(fake.repository),
      runAgent: async () => "unused",
      now: () => "2026-09-09T08:05:00.000Z",
    });

    expect(await handler({ accessToken: "token", placementId: "placement-1", userMessage: "   ", seed: makeSeed() }))
      .toMatchObject({ ok: false, status: 400 });
    expect(await handler({ accessToken: "token", placementId: "placement-1", userMessage: "x".repeat(10001), seed: makeSeed() }))
      .toMatchObject({ ok: false, status: 400 });
    expect(fake.sessions).toHaveLength(0);
  });
});
