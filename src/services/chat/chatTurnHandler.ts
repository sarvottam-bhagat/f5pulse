import type { EasyInputMessage } from "openai/resources/responses/responses";
import {
  buildAgentPlacementContext,
  serializeAgentPlacementContext,
} from "@/domain/chat/agentContext";
import {
  buildAgentInput,
  F5_AGENT_SYSTEM_PROMPT,
} from "@/domain/chat/agentPrompt";
import { summarizePlacement } from "@/domain/chat/deterministicSummaries";
import {
  buildAgentPortfolioContext,
  serializeAgentPortfolioContext,
  summarizePortfolio,
} from "@/domain/chat/portfolioContext";
import type {
  ChatContextAttachment,
  ChatMessage,
  ChatMessageStatus,
  ChatSession,
} from "@/domain/chat/types";
import type { Seed } from "@/domain/types";

export interface ChatRepositoryPort {
  getSession(sessionId: string): Promise<ChatSession | null>;
  createSession(input: { title: string; context: ChatContextAttachment | null }): Promise<ChatSession>;
  listMessages(sessionId: string): Promise<ChatMessage[]>;
  createMessage(input: {
    sessionId: string;
    role: "user" | "assistant";
    content: string;
    status: ChatMessageStatus;
    metadata?: Record<string, unknown>;
  }): Promise<ChatMessage>;
  touchSession(sessionId: string, updatedAt: string): Promise<void>;
}

export interface AuthenticatedChatScope {
  userId: string;
  repository: ChatRepositoryPort;
}

interface ChatTurnDependencies {
  authenticate(accessToken: string): Promise<AuthenticatedChatScope | null>;
  runAgent(input: {
    instructions: string;
    input: EasyInputMessage[];
    onTextDelta?: (delta: string) => void | Promise<void>;
  }): Promise<string>;
  now(): string;
  today?(): string;
}

export interface ChatTurnCallbacks {
  onUserMessage?(value: { session: ChatSession; userMessage: ChatMessage }): void | Promise<void>;
  onTextDelta?(delta: string): void | Promise<void>;
}

export interface ChatTurnRequest {
  accessToken: string | null;
  sessionId?: string;
  placementId?: string;
  userMessage: unknown;
  seed: Seed;
}

export type ChatTurnResult =
  | {
      ok: true;
      session: ChatSession;
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
    }
  | { ok: false; status: 400 | 401 | 404 | 500 | 503; message: string };

function sessionTitle(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.length <= 60 ? normalized : `${normalized.slice(0, 59).trimEnd()}…`;
}

export function readBearerToken(header: string | null): string | null {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export function createChatTurnHandler(dependencies: ChatTurnDependencies) {
  return async function handleChatTurn(
    request: ChatTurnRequest,
    callbacks: ChatTurnCallbacks = {},
  ): Promise<ChatTurnResult> {
    if (typeof request.userMessage !== "string") {
      return { ok: false, status: 400, message: "Enter a message before sending." };
    }
    const userMessageText = request.userMessage.trim();
    if (!userMessageText || userMessageText.length > 10_000) {
      return { ok: false, status: 400, message: "Enter a message between 1 and 10,000 characters." };
    }
    if (!request.accessToken) {
      return { ok: false, status: 401, message: "Please reconnect your private chat session." };
    }

    let scope: AuthenticatedChatScope | null;
    try {
      scope = await dependencies.authenticate(request.accessToken);
    } catch {
      return { ok: false, status: 503, message: "Private chat is temporarily unavailable." };
    }
    if (!scope) {
      return { ok: false, status: 401, message: "Please reconnect your private chat session." };
    }

    try {
      let session: ChatSession | null = null;
      if (request.sessionId) {
        session = await scope.repository.getSession(request.sessionId);
        if (!session) {
          return { ok: false, status: 404, message: "This conversation is no longer available." };
        }
      } else {
        let context: ChatContextAttachment | null = null;
        if (request.placementId) {
          const placement = request.seed.placements.find((item) => item.id === request.placementId);
          if (!placement || placement.archived || placement.status !== "Active") {
            return { ok: false, status: 400, message: "Choose an active professional before sending a message." };
          }
          context = {
            placementId: placement.id,
            clientId: placement.clientId,
            professionalId: placement.professionalId,
          };
        }
        session = await scope.repository.createSession({
          title: sessionTitle(userMessageText),
          context,
        });
      }

      const asOf = dependencies.today?.() ?? dependencies.now().slice(0, 10);
      const placementContext = session.context
        ? buildAgentPlacementContext(request.seed, session.context.placementId, asOf)
        : null;
      if (session.context && (!placementContext || placementContext.placement.status !== "Active")) {
        return { ok: false, status: 400, message: "Choose an active professional before sending a message." };
      }
      const portfolioContext = session.context
        ? null
        : buildAgentPortfolioContext(request.seed, asOf);
      const serializedContext = placementContext
        ? serializeAgentPlacementContext(placementContext)
        : serializeAgentPortfolioContext(portfolioContext!);

      const history = await scope.repository.listMessages(session.id);
      const storedUserMessage = await scope.repository.createMessage({
        sessionId: session.id,
        role: "user",
        content: userMessageText,
        status: "complete",
      });
      try {
        await callbacks.onUserMessage?.({ session, userMessage: storedUserMessage });
      } catch {
        // Client disconnects must not prevent the saved turn from completing.
      }
      const input = buildAgentInput({
        serializedContext,
        history: history
          .filter((message): message is ChatMessage & { role: "user" | "assistant" } =>
            message.role === "user" || message.role === "assistant")
          .map((message) => ({
            role: message.role,
            content: message.content,
            status: message.status ?? "complete",
          })),
        userMessage: userMessageText,
      });

      let assistantContent: string;
      let assistantStatus: ChatMessageStatus = "complete";
      let assistantMetadata: Record<string, unknown> = {};
      try {
        assistantContent = await dependencies.runAgent({
          instructions: F5_AGENT_SYSTEM_PROMPT,
          input,
          onTextDelta: async (delta) => {
            try {
              await callbacks.onTextDelta?.(delta);
            } catch {
              // Continue generating and persisting even if the stream closes.
            }
          },
        });
      } catch {
        assistantContent = placementContext
          ? summarizePlacement(placementContext, placementContext.asOf)
          : summarizePortfolio(portfolioContext!);
        assistantStatus = "failed";
        assistantMetadata = { fallback: true };
      }

      const assistantMessage = await scope.repository.createMessage({
        sessionId: session.id,
        role: "assistant",
        content: assistantContent,
        status: assistantStatus,
        metadata: assistantMetadata,
      });
      const updatedAt = dependencies.now();
      await scope.repository.touchSession(session.id, updatedAt);

      return {
        ok: true,
        session: { ...session, updatedAt },
        userMessage: storedUserMessage,
        assistantMessage,
      };
    } catch {
      return { ok: false, status: 500, message: "Your message could not be saved. Please retry." };
    }
  };
}
