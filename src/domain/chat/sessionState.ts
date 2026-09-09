import type { ChatContextAttachment, ChatMessage, ChatSession, ChatViewMode } from "./types";

const SESSION_TITLE_LENGTH = 40;

function sessionTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= SESSION_TITLE_LENGTH) return normalized || "New conversation";
  return `${normalized.slice(0, SESSION_TITLE_LENGTH - 1).trimEnd()}…`;
}

export function createChatSession({
  id,
  context,
  viewMode,
  firstMessage,
}: {
  id: string;
  context: ChatContextAttachment;
  viewMode: ChatViewMode;
  firstMessage: ChatMessage;
}): ChatSession {
  return {
    id,
    title: sessionTitle(firstMessage.content),
    context,
    viewMode,
    messages: [firstMessage],
    updatedAt: firstMessage.createdAt,
  };
}

export function appendChatSessionMessage(
  sessions: ChatSession[],
  sessionId: string,
  message: ChatMessage,
): ChatSession[] {
  const selected = sessions.find((session) => session.id === sessionId);
  if (!selected) return sessions;

  const updated = {
    ...selected,
    messages: [...selected.messages, message],
    updatedAt: message.createdAt,
  };

  return [updated, ...sessions.filter((session) => session.id !== sessionId)];
}
