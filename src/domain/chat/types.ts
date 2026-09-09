// Chat domain types: one placement-centered conversation, with an attached
// context (client/professional/placement/issue) and a view mode that
// determines whether the conversation frames things from the client side
// or the professional side while retaining the full placement history.

import type { ProposedAction } from "./actions";

export type ChatViewMode = "client" | "professional";

export interface ChatContextAttachment {
  placementId: string;
  clientId: string;
  professionalId: string;
  issueId?: string;
}

export type ChatMessageRole = "user" | "assistant" | "system";
export type ChatMessageStatus = "pending" | "complete" | "failed";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  status?: ChatMessageStatus;
  metadata?: Record<string, unknown>;
  proposedActions?: ProposedAction[];
  isFallback?: boolean;
}

export interface ChatConversation {
  context: ChatContextAttachment | null;
  viewMode: ChatViewMode;
  messages: ChatMessage[];
}

export interface ChatSession {
  id: string;
  title: string;
  context: ChatContextAttachment | null;
  viewMode: ChatViewMode;
  messages: ChatMessage[];
  createdAt?: string;
  updatedAt: string;
}
