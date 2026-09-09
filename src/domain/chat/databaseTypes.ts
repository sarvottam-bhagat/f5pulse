import type { ChatMessage, ChatMessageStatus, ChatSession } from "./types";

export interface ChatSessionRow {
  id: string;
  user_id: string;
  placement_id: string;
  client_id: string;
  professional_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRow {
  id: string;
  session_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  status: ChatMessageStatus;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function mapChatSessionRow(row: ChatSessionRow): ChatSession {
  return {
    id: row.id,
    title: row.title,
    context: {
      placementId: row.placement_id,
      clientId: row.client_id,
      professionalId: row.professional_id,
    },
    viewMode: "client",
    messages: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapChatMessageRow(row: ChatMessageRow): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    status: row.status,
    metadata: row.metadata,
    isFallback: row.metadata.fallback === true,
    createdAt: row.created_at,
  };
}
