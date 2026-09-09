import { describe, expect, it } from "vitest";
import {
  mapChatMessageRow,
  mapChatSessionRow,
  type ChatMessageRow,
  type ChatSessionRow,
} from "@/domain/chat/databaseTypes";

describe("chat database row mapping", () => {
  it("maps a session row to the placement-centered chat model", () => {
    const row: ChatSessionRow = {
      id: "session-1",
      user_id: "user-1",
      placement_id: "placement-1",
      client_id: "client-1",
      professional_id: "professional-1",
      title: "Why is this critical?",
      created_at: "2026-09-09T08:00:00.000Z",
      updated_at: "2026-09-09T08:01:00.000Z",
    };

    expect(mapChatSessionRow(row)).toEqual({
      id: "session-1",
      title: "Why is this critical?",
      context: {
        placementId: "placement-1",
        clientId: "client-1",
        professionalId: "professional-1",
      },
      viewMode: "client",
      messages: [],
      createdAt: "2026-09-09T08:00:00.000Z",
      updatedAt: "2026-09-09T08:01:00.000Z",
    });
  });

  it("maps failed fallback metadata without leaking database fields", () => {
    const row: ChatMessageRow = {
      id: "message-1",
      session_id: "session-1",
      user_id: "user-1",
      role: "assistant",
      content: "Deterministic operational summary",
      status: "failed",
      metadata: { fallback: true },
      created_at: "2026-09-09T08:01:00.000Z",
    };

    expect(mapChatMessageRow(row)).toEqual({
      id: "message-1",
      role: "assistant",
      content: "Deterministic operational summary",
      status: "failed",
      metadata: { fallback: true },
      isFallback: true,
      createdAt: "2026-09-09T08:01:00.000Z",
    });
  });
});
