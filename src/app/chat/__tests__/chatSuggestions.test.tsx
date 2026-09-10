// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptySeed } from "@/store/__tests__/fixtures";
import ChatPage from "../page";

const chat = vi.hoisted(() => ({
  sendMessage: vi.fn(async () => undefined),
  selectSession: vi.fn(async () => undefined),
  startNewConversation: vi.fn(),
  retry: vi.fn(async () => undefined),
  retryHistory: vi.fn(async () => undefined),
  deleteSession: vi.fn(async () => undefined),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/store/useStore", () => ({
  useStoreData: () => ({ seed: emptySeed() }),
}));

vi.mock("@/hooks/usePersistentChat", () => ({
  usePersistentChat: () => ({
    status: "ready",
    historyError: null,
    sendError: null,
    sessions: [],
    activeSession: null,
    messages: [],
    pending: false,
    ...chat,
  }),
}));

describe("Chat welcome suggestions", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    chat.sendMessage.mockClear();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it("sends a portfolio question when no placement is attached", async () => {
    await act(async () => root.render(<ChatPage />));

    const suggestion = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Who needs my attention today?",
    );

    expect(suggestion).toBeDefined();
    expect(suggestion?.disabled).toBe(false);

    await act(async () => suggestion?.click());
    expect(chat.sendMessage).toHaveBeenCalledWith({
      context: null,
      userMessage: "Who needs my attention today?",
    });
  });
});
