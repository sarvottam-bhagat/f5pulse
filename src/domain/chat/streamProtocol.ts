import type { ChatMessage, ChatSession } from "./types";

export type ChatStreamEvent =
  | { type: "user"; session: ChatSession; userMessage: ChatMessage }
  | { type: "delta"; delta: string }
  | {
      type: "done";
      session: ChatSession;
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
    }
  | { type: "error"; error: string };

export function encodeChatStreamEvent(event: ChatStreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export function createChatStreamParser(onEvent: (event: ChatStreamEvent) => void) {
  let buffer = "";

  function parseLine(line: string) {
    const value = line.trim();
    if (!value) return;
    onEvent(JSON.parse(value) as ChatStreamEvent);
  }

  return {
    push(chunk: string) {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      lines.forEach(parseLine);
    },
    finish() {
      parseLine(buffer);
      buffer = "";
    },
  };
}
