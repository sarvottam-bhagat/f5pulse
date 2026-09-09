"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  mapChatMessageRow,
  mapChatSessionRow,
  type ChatMessageRow,
  type ChatSessionRow,
} from "@/domain/chat/databaseTypes";
import type {
  ChatContextAttachment,
  ChatMessage,
  ChatSession,
} from "@/domain/chat/types";
import {
  createChatStreamParser,
  type ChatStreamEvent,
} from "@/domain/chat/streamProtocol";
import {
  ensureAnonymousSession,
  getBrowserSupabase,
} from "@/lib/supabase/browser";

interface ChatTurnResponse {
  session: ChatSession;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export interface PersistentChatGateway {
  initialize(): Promise<{ accessToken: string; sessions: ChatSession[] }>;
  loadMessages(sessionId: string): Promise<ChatMessage[]>;
  sendTurn(input: {
    accessToken: string;
    sessionId?: string;
    placementId?: string;
    userMessage: string;
  }, callbacks: {
    onUserMessage(value: { session: ChatSession; userMessage: ChatMessage }): void;
    onTextDelta(delta: string): void;
  }): Promise<ChatTurnResponse>;
  deleteSession(input: { accessToken: string; sessionId: string }): Promise<void>;
  subscribeToToken(onToken: (accessToken: string | null) => void): () => void;
}

function newestFirst(sessions: ChatSession[]): ChatSession[] {
  return [...sessions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

let optimisticMessageNumber = 0;

function optimisticMessage(
  role: "user" | "assistant",
  content: string,
  status: "complete" | "pending",
): ChatMessage {
  optimisticMessageNumber += 1;
  return {
    id: `optimistic-${optimisticMessageNumber}`,
    role,
    content,
    status,
    createdAt: new Date().toISOString(),
  };
}

function replaceMessage(
  messages: ChatMessage[],
  messageId: string,
  update: (message: ChatMessage) => ChatMessage,
): ChatMessage[] {
  return messages.map((message) => message.id === messageId ? update(message) : message);
}

export const browserChatGateway: PersistentChatGateway = {
  async initialize() {
    const client = getBrowserSupabase();
    const session = await ensureAnonymousSession(client.auth);
    const { data, error } = await client
      .from("chat_sessions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });
    if (error) throw new Error("Chat history is temporarily unavailable.");
    return {
      accessToken: session.access_token,
      sessions: ((data ?? []) as ChatSessionRow[]).map(mapChatSessionRow),
    };
  },

  async loadMessages(sessionId) {
    const client = getBrowserSupabase();
    const { data, error } = await client
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) throw new Error("Chat history is temporarily unavailable.");
    return ((data ?? []) as ChatMessageRow[]).map(mapChatMessageRow);
  },

  async sendTurn(input, callbacks) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({
        sessionId: input.sessionId,
        placementId: input.placementId,
        userMessage: input.userMessage,
      }),
    });
    if (!response.ok || !response.body) {
      throw new Error("Your message could not be sent. Please retry.");
    }

    let completed: ChatTurnResponse | null = null;
    let streamError: string | null = null;
    const parser = createChatStreamParser((event: ChatStreamEvent) => {
      if (event.type === "user") callbacks.onUserMessage(event);
      if (event.type === "delta") callbacks.onTextDelta(event.delta);
      if (event.type === "done") completed = event;
      if (event.type === "error") streamError = event.error;
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      parser.push(decoder.decode(value, { stream: true }));
    }
    parser.push(decoder.decode());
    parser.finish();

    if (streamError) throw new Error(streamError);
    if (!completed) throw new Error("The response stream ended unexpectedly. Please retry.");
    return completed;
  },

  async deleteSession({ sessionId }) {
    const client = getBrowserSupabase();
    const { error } = await client.from("chat_sessions").delete().eq("id", sessionId);
    if (error) throw new Error("This conversation could not be deleted.");
  },

  subscribeToToken(onToken) {
    const client = getBrowserSupabase();
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      onToken(session?.access_token ?? null);
    });
    return () => data.subscription.unsubscribe();
  },
};

type ChatStatus = "loading" | "ready" | "error";

interface SendInput {
  context: ChatContextAttachment;
  userMessage: string;
}

export interface PersistentChatState {
  status: ChatStatus;
  historyError: string | null;
  sendError: string | null;
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  messages: ChatMessage[];
  pending: boolean;
  selectSession(sessionId: string): Promise<void>;
  startNewConversation(): void;
  sendMessage(input: SendInput): Promise<void>;
  retry(): Promise<void>;
  retryHistory(): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;
}

export function usePersistentChat({
  gateway = browserChatGateway,
}: {
  gateway?: PersistentChatGateway;
} = {}): PersistentChatState {
  const gatewayRef = useRef(gateway);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<ChatStatus>("loading");
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [draftMessages, setDraftMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<SendInput | null>(null);

  const initialize = useCallback(async () => {
    setStatus("loading");
    setHistoryError(null);
    try {
      const result = await gatewayRef.current.initialize();
      setAccessToken(result.accessToken);
      setSessions(newestFirst(result.sessions));
      setStatus("ready");
    } catch {
      setStatus("error");
      setHistoryError("Chat history is temporarily unavailable.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) return initialize();
    });
    const unsubscribe = gatewayRef.current.subscribeToToken(setAccessToken);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [initialize]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) ?? null,
    [activeSessionId, sessions],
  );

  const selectSession = useCallback(async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setDraftMessages([]);
    setSendError(null);
    try {
      const messages = await gatewayRef.current.loadMessages(sessionId);
      setSessions((current) => current.map((session) =>
        session.id === sessionId ? { ...session, messages } : session));
    } catch {
      setHistoryError("Chat history is temporarily unavailable.");
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setActiveSessionId(null);
    setDraftMessages([]);
    setSendError(null);
    setLastAttempt(null);
  }, []);

  const sendMessage = useCallback(async (input: SendInput) => {
    if (!accessToken || pending) return;
    const selected = sessions.find((session) => session.id === activeSessionId) ?? null;
    const optimisticUser = optimisticMessage("user", input.userMessage, "complete");
    const optimisticAssistant = optimisticMessage("assistant", "", "pending");
    const previousMessages = selected?.messages ?? [];
    if (selected) {
      setSessions((current) => current.map((session) => session.id === selected.id
        ? { ...session, messages: [...previousMessages, optimisticUser, optimisticAssistant] }
        : session));
    } else {
      setDraftMessages([optimisticUser, optimisticAssistant]);
    }
    setPending(true);
    setSendError(null);
    setLastAttempt(input);
    let streamedSessionId = selected?.id ?? null;
    try {
      const result = await gatewayRef.current.sendTurn(selected
        ? {
            accessToken,
            sessionId: selected.id,
            userMessage: input.userMessage,
          }
        : {
            accessToken,
            placementId: input.context.placementId,
            userMessage: input.userMessage,
          }, {
            onUserMessage({ session, userMessage }) {
              streamedSessionId = session.id;
              const streamingSession: ChatSession = {
                ...session,
                messages: [...previousMessages, userMessage, optimisticAssistant],
              };
              setSessions((current) => newestFirst([
                streamingSession,
                ...current.filter((item) => item.id !== session.id),
              ]));
              setActiveSessionId(session.id);
              setDraftMessages([]);
            },
            onTextDelta(delta) {
              if (!streamedSessionId) {
                setDraftMessages((current) => replaceMessage(
                  current,
                  optimisticAssistant.id,
                  (message) => ({ ...message, content: message.content + delta }),
                ));
                return;
              }
              setSessions((current) => current.map((session) => session.id === streamedSessionId
                ? {
                    ...session,
                    messages: replaceMessage(
                      session.messages,
                      optimisticAssistant.id,
                      (message) => ({ ...message, content: message.content + delta }),
                    ),
                  }
                : session));
            },
          });
      const updated: ChatSession = {
        ...result.session,
        messages: [...previousMessages, result.userMessage, result.assistantMessage],
      };
      setSessions((current) => newestFirst([
        updated,
        ...current.filter((session) => session.id !== updated.id),
      ]));
      setActiveSessionId(updated.id);
      setDraftMessages([]);
      if (result.assistantMessage.status === "failed") {
        setSendError("AI is temporarily unavailable. The saved fallback can be retried.");
      } else {
        setLastAttempt(null);
      }
    } catch {
      if (streamedSessionId) {
        setSessions((current) => current.map((session) => session.id === streamedSessionId
          ? {
              ...session,
              messages: replaceMessage(
                session.messages,
                optimisticAssistant.id,
                (message) => ({ ...message, status: "failed" }),
              ),
            }
          : session));
      } else {
        setDraftMessages((current) => replaceMessage(
          current,
          optimisticAssistant.id,
          (message) => ({ ...message, status: "failed" }),
        ));
      }
      setSendError("Your message could not be sent. Please retry.");
    } finally {
      setPending(false);
    }
  }, [accessToken, activeSessionId, pending, sessions]);

  const retry = useCallback(async () => {
    if (lastAttempt) await sendMessage(lastAttempt);
  }, [lastAttempt, sendMessage]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!accessToken) return;
    try {
      await gatewayRef.current.deleteSession({ accessToken, sessionId });
      setSessions((current) => current.filter((session) => session.id !== sessionId));
      setActiveSessionId((current) => current === sessionId ? null : current);
    } catch {
      setHistoryError("This conversation could not be deleted.");
    }
  }, [accessToken]);

  return {
    status,
    historyError,
    sendError,
    sessions,
    activeSession,
    messages: activeSession?.messages ?? draftMessages,
    pending,
    selectSession,
    startNewConversation,
    sendMessage,
    retry,
    retryHistory: initialize,
    deleteSession,
  };
}
