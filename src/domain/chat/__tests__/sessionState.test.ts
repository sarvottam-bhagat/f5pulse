import { describe, expect, it } from "vitest";
import * as chatDomain from "../index";
import type { ChatContextAttachment, ChatMessage, ChatViewMode } from "../types";

type Session = {
  id: string;
  title: string;
  context: ChatContextAttachment;
  viewMode: ChatViewMode;
  messages: ChatMessage[];
  updatedAt: string;
};

type CreateSession = (input: {
  id: string;
  context: ChatContextAttachment;
  viewMode: ChatViewMode;
  firstMessage: ChatMessage;
}) => Session;

type AppendMessage = (sessions: Session[], sessionId: string, message: ChatMessage) => Session[];

const context: ChatContextAttachment = {
  placementId: "placement-1",
  clientId: "client-1",
  professionalId: "professional-1",
};

const firstMessage: ChatMessage = {
  id: "message-1",
  role: "user",
  content: "Why is this placement at risk and what should I do next?",
  createdAt: "2026-09-09T09:00:00.000Z",
};

describe("temporary chat sessions", () => {
  it("creates a restorable session from the first message", () => {
    const createSession = (chatDomain as typeof chatDomain & { createChatSession?: CreateSession }).createChatSession;

    expect(createSession).toBeTypeOf("function");
    expect(createSession?.({ id: "session-1", context, viewMode: "client", firstMessage })).toEqual({
      id: "session-1",
      title: "Why is this placement at risk and what…",
      context,
      viewMode: "client",
      messages: [firstMessage],
      updatedAt: "2026-09-09T09:00:00.000Z",
    });
  });

  it("appends a reply only to the selected session and moves it to the top", () => {
    const appendMessage = (chatDomain as typeof chatDomain & { appendChatSessionMessage?: AppendMessage })
      .appendChatSessionMessage;
    const createSession = (chatDomain as typeof chatDomain & { createChatSession?: CreateSession }).createChatSession;
    const otherMessage = { ...firstMessage, id: "message-2", content: "Summarize the placement" };
    const reply: ChatMessage = {
      id: "message-3",
      role: "assistant",
      content: "This placement needs attention.",
      createdAt: "2026-09-09T09:01:00.000Z",
    };

    expect(appendMessage).toBeTypeOf("function");
    expect(createSession).toBeTypeOf("function");

    const sessions = [
      createSession?.({ id: "session-2", context, viewMode: "client", firstMessage: otherMessage }),
      createSession?.({ id: "session-1", context, viewMode: "client", firstMessage }),
    ].filter((session): session is Session => Boolean(session));
    const result = appendMessage?.(sessions, "session-1", reply);

    expect(result?.map((session) => session.id)).toEqual(["session-1", "session-2"]);
    expect(result?.[0].messages).toEqual([firstMessage, reply]);
    expect(result?.[0].updatedAt).toBe("2026-09-09T09:01:00.000Z");
    expect(result?.[1].messages).toEqual([otherMessage]);
  });
});
