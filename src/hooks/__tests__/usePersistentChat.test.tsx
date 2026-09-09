// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ChatContextAttachment, ChatMessage, ChatSession } from "@/domain/chat/types";
import {
  usePersistentChat,
  type PersistentChatGateway,
  type PersistentChatState,
} from "../usePersistentChat";

const context: ChatContextAttachment = {
  placementId: "placement-1",
  clientId: "client-1",
  professionalId: "professional-1",
};

function session(id: string, updatedAt: string): ChatSession {
  return {
    id,
    title: `Session ${id}`,
    context,
    viewMode: "client",
    messages: [],
    createdAt: "2026-09-09T08:00:00.000Z",
    updatedAt,
  };
}

function message(id: string, role: "user" | "assistant", content: string): ChatMessage {
  return {
    id,
    role,
    content,
    status: "complete",
    createdAt: "2026-09-09T08:01:00.000Z",
  };
}

describe("usePersistentChat", () => {
  let container: HTMLDivElement;
  let root: Root;
  let current: PersistentChatState | null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    current = null;
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  async function renderHook(gateway: PersistentChatGateway) {
    function Harness() {
      current = usePersistentChat({ gateway });
      return <div>{current.sessions.length}</div>;
    }
    await act(async () => {
      root.render(<Harness />);
      await Promise.resolve();
      await Promise.resolve();
    });
  }

  it("shows the submitted question immediately while the server is still responding", async () => {
    let finish: ((value: {
      session: ChatSession;
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
    }) => void) | undefined;
    const response = new Promise<{
      session: ChatSession;
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
    }>((resolve) => { finish = resolve; });
    const created = session("created", "2026-09-09T09:00:00.000Z");
    const gateway: PersistentChatGateway = {
      initialize: async () => ({ accessToken: "token", sessions: [] }),
      loadMessages: async () => [],
      sendTurn: async () => response,
      deleteSession: async () => undefined,
      subscribeToToken: () => () => undefined,
    };

    await renderHook(gateway);
    await act(async () => {
      void current?.sendMessage({ context, userMessage: "Visible now" });
      await Promise.resolve();
    });

    expect(current?.messages).toMatchObject([
      { role: "user", content: "Visible now", status: "complete" },
      { role: "assistant", content: "", status: "pending" },
    ]);

    await act(async () => finish?.({
      session: created,
      userMessage: message("u1", "user", "Visible now"),
      assistantMessage: message("a1", "assistant", "Done"),
    }));
  });

  it("updates the pending assistant message as streamed deltas arrive", async () => {
    const created = session("streamed", "2026-09-09T09:00:00.000Z");
    const storedUser = message("u-stream", "user", "Stream it");
    const storedAssistant = message("a-stream", "assistant", "Hello world");
    const gateway = {
      initialize: async () => ({ accessToken: "token", sessions: [] }),
      loadMessages: async () => [],
      sendTurn: async (_input: unknown, stream: {
        onUserMessage(value: { session: ChatSession; userMessage: ChatMessage }): void;
        onTextDelta(delta: string): void;
      }) => {
        stream.onUserMessage({ session: created, userMessage: storedUser });
        stream.onTextDelta("Hello");
        await Promise.resolve();
        stream.onTextDelta(" world");
        return { session: created, userMessage: storedUser, assistantMessage: storedAssistant };
      },
      deleteSession: async () => undefined,
      subscribeToToken: () => () => undefined,
    } as unknown as PersistentChatGateway;

    await renderHook(gateway);
    await act(async () => current?.sendMessage({ context, userMessage: "Stream it" }));

    expect(current?.messages.at(-1)).toMatchObject({
      role: "assistant",
      content: "Hello world",
      status: "complete",
    });
  });

  it("initializes anonymous history newest-first and restores selected messages", async () => {
    const older = session("older", "2026-09-09T08:00:00.000Z");
    const newer = session("newer", "2026-09-09T09:00:00.000Z");
    const gateway: PersistentChatGateway = {
      initialize: vi.fn(async () => ({ accessToken: "token", sessions: [older, newer] })),
      loadMessages: vi.fn(async () => [message("m1", "user", "Question"), message("m2", "assistant", "Answer")]),
      sendTurn: vi.fn(),
      deleteSession: vi.fn(),
      subscribeToToken: () => () => undefined,
    };

    await renderHook(gateway);
    expect(current?.sessions.map((item) => item.id)).toEqual(["newer", "older"]);
    expect(current?.status).toBe("ready");

    await act(async () => current?.selectSession("older"));
    expect(current?.activeSession?.id).toBe("older");
    expect(current?.messages.map((item) => item.content)).toEqual(["Question", "Answer"]);
  });

  it("persists first and continuing messages without duplicating sessions", async () => {
    const created = session("created", "2026-09-09T09:00:00.000Z");
    const sendTurn = vi.fn(async ({ sessionId }: { sessionId?: string }) => ({
      session: created,
      userMessage: message(sessionId ? "u2" : "u1", "user", sessionId ? "Continue" : "Start"),
      assistantMessage: message(sessionId ? "a2" : "a1", "assistant", "Answer"),
    }));
    const gateway: PersistentChatGateway = {
      initialize: async () => ({ accessToken: "token", sessions: [] }),
      loadMessages: async () => [],
      sendTurn,
      deleteSession: async () => undefined,
      subscribeToToken: () => () => undefined,
    };

    await renderHook(gateway);
    await act(async () => current?.sendMessage({ context, userMessage: "Start" }));
    expect(sendTurn.mock.calls[0][0]).toMatchObject({ accessToken: "token", placementId: "placement-1", userMessage: "Start" });
    expect(current?.sessions).toHaveLength(1);
    expect(current?.messages).toHaveLength(2);

    await act(async () => current?.sendMessage({ context, userMessage: "Continue" }));
    expect(sendTurn.mock.calls[1][0]).toEqual({ accessToken: "token", sessionId: "created", userMessage: "Continue" });
    expect(current?.sessions).toHaveLength(1);
    expect(current?.messages).toHaveLength(4);
  });

  it("keeps a failed question retryable and supports new/delete flows", async () => {
    const existing = session("existing", "2026-09-09T09:00:00.000Z");
    let attempt = 0;
    const gateway: PersistentChatGateway = {
      initialize: async () => ({ accessToken: "token", sessions: [existing] }),
      loadMessages: async () => [],
      sendTurn: async () => {
        attempt += 1;
        if (attempt === 1) throw new Error("offline");
        return {
          session: existing,
          userMessage: message("u1", "user", "Retry me"),
          assistantMessage: message("a1", "assistant", "Recovered"),
        };
      },
      deleteSession: vi.fn(async () => undefined),
      subscribeToToken: () => () => undefined,
    };

    await renderHook(gateway);
    await act(async () => current?.selectSession("existing"));
    await act(async () => current?.sendMessage({ context, userMessage: "Retry me" }));
    expect(current?.sendError).toBe("Your message could not be sent. Please retry.");

    await act(async () => current?.retry());
    expect(current?.messages.at(-1)?.content).toBe("Recovered");

    act(() => current?.startNewConversation());
    expect(current?.activeSession).toBeNull();
    expect(current?.sessions).toHaveLength(1);

    await act(async () => current?.selectSession("existing"));
    await act(async () => current?.deleteSession("existing"));
    expect(current?.sessions).toHaveLength(0);
    expect(current?.activeSession).toBeNull();
  });
});
