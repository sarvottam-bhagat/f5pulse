import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChatInputBar } from "../ChatInputBar";
import { ConversationSidebar } from "../ConversationSidebar";
import { MessageBubble } from "../MessageBubble";
import { emptySeed } from "@/store/__tests__/fixtures";

describe("ChatInputBar", () => {
  it("keeps the primary message composer discoverable and explains its keyboard behavior", () => {
    const html = renderToStaticMarkup(createElement(ChatInputBar, { onSend: () => undefined }));

    expect(html).toContain('aria-label="Message composer"');
    expect(html).toContain('placeholder="Ask anything…"');
    expect(html).toContain('aria-label="Send message"');
    expect(html).toContain("Shift + Enter");
  });
});

describe("MessageBubble", () => {
  it("renders assistant Markdown instead of showing formatting characters", () => {
    const html = renderToStaticMarkup(createElement(MessageBubble, {
      message: {
        id: "assistant-1",
        role: "assistant",
        content: "**Healthy**\n\n- Feedback is current\n- No open issues",
        status: "complete",
        createdAt: "2026-09-09T08:00:00.000Z",
      },
    }));

    expect(html).toContain("<strong>Healthy</strong>");
    expect(html).toContain("<li>Feedback is current</li>");
    expect(html).not.toContain("**Healthy**");
  });
});

describe("ConversationSidebar", () => {
  it("explains loading and private persistence states", () => {
    const loading = renderToStaticMarkup(createElement(ConversationSidebar, {
      seed: emptySeed(),
      sessions: [],
      activeSessionId: null,
      loading: true,
      error: null,
      onRetry: () => undefined,
      onDelete: () => undefined,
      onSelect: () => undefined,
      onNew: () => undefined,
      onClose: () => undefined,
    }));
    const ready = renderToStaticMarkup(createElement(ConversationSidebar, {
      seed: emptySeed(),
      sessions: [],
      activeSessionId: null,
      loading: false,
      error: null,
      onRetry: () => undefined,
      onDelete: () => undefined,
      onSelect: () => undefined,
      onNew: () => undefined,
      onClose: () => undefined,
    }));

    expect(loading).toContain("Loading conversations…");
    expect(ready).toContain("Your conversations are saved privately.");
    expect(ready).not.toContain("temporary in this UI preview");
  });
});
