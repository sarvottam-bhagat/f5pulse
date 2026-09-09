import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapChatMessageRow,
  mapChatSessionRow,
  type ChatMessageRow,
  type ChatSessionRow,
} from "@/domain/chat/databaseTypes";
import type {
  ChatContextAttachment,
  ChatMessage,
  ChatMessageStatus,
  ChatSession,
} from "@/domain/chat/types";
import type { ChatRepositoryPort } from "./chatTurnHandler";

const HISTORY_ERROR = "Chat history is temporarily unavailable.";

export class ChatRepository implements ChatRepositoryPort {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async listSessions(): Promise<ChatSession[]> {
    const { data, error } = await this.client
      .from("chat_sessions")
      .select("*")
      .eq("user_id", this.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(HISTORY_ERROR);
    return ((data ?? []) as ChatSessionRow[]).map(mapChatSessionRow);
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const { data, error } = await this.client
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", this.userId)
      .maybeSingle();
    if (error) throw new Error(HISTORY_ERROR);
    return data ? mapChatSessionRow(data as ChatSessionRow) : null;
  }

  async createSession(input: {
    title: string;
    context: ChatContextAttachment;
  }): Promise<ChatSession> {
    const { data, error } = await this.client
      .from("chat_sessions")
      .insert({
        user_id: this.userId,
        placement_id: input.context.placementId,
        client_id: input.context.clientId,
        professional_id: input.context.professionalId,
        title: input.title,
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(HISTORY_ERROR);
    return mapChatSessionRow(data as ChatSessionRow);
  }

  async listMessages(sessionId: string): Promise<ChatMessage[]> {
    const { data, error } = await this.client
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .eq("user_id", this.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(HISTORY_ERROR);
    return ((data ?? []) as ChatMessageRow[]).map(mapChatMessageRow);
  }

  async createMessage(input: {
    sessionId: string;
    role: "user" | "assistant";
    content: string;
    status: ChatMessageStatus;
    metadata?: Record<string, unknown>;
  }): Promise<ChatMessage> {
    const { data, error } = await this.client
      .from("chat_messages")
      .insert({
        session_id: input.sessionId,
        user_id: this.userId,
        role: input.role,
        content: input.content,
        status: input.status,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();
    if (error || !data) throw new Error(HISTORY_ERROR);
    return mapChatMessageRow(data as ChatMessageRow);
  }

  async touchSession(sessionId: string, updatedAt: string): Promise<void> {
    const { error } = await this.client
      .from("chat_sessions")
      .update({ updated_at: updatedAt })
      .eq("id", sessionId)
      .eq("user_id", this.userId);
    if (error) throw new Error(HISTORY_ERROR);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const { error } = await this.client
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", this.userId);
    if (error) throw new Error(HISTORY_ERROR);
  }
}
