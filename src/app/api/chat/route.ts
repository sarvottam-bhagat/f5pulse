import { NextRequest, NextResponse } from "next/server";
import { createUserScopedSupabase } from "@/lib/supabase/server";
import { ChatRepository } from "@/services/chat/chatRepository";
import {
  createChatTurnHandler,
  readBearerToken,
} from "@/services/chat/chatTurnHandler";
import { runOpenAIAgent } from "@/services/chat/openaiAgent";
import { loadOriginalSeed } from "@/store/seedData";
import {
  encodeChatStreamEvent,
  type ChatStreamEvent,
} from "@/domain/chat/streamProtocol";

export const runtime = "nodejs";

const handleChatTurn = createChatTurnHandler({
  async authenticate(accessToken) {
    const client = createUserScopedSupabase(accessToken);
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) return null;
    return {
      userId: data.user.id,
      repository: new ChatRepository(client, data.user.id),
    };
  },
  runAgent: ({ instructions, input, onTextDelta }) => runOpenAIAgent({
    instructions,
    input,
    onTextDelta,
  }),
  now: () => new Date().toISOString(),
});

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function POST(request: NextRequest) {
  const token = readBearerToken(request.headers.get("authorization"));
  const body = await request.json().catch(() => null);
  const record = body && typeof body === "object"
    ? body as Record<string, unknown>
    : {};
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let open = true;
      const send = (event: ChatStreamEvent) => {
        if (!open) return;
        controller.enqueue(encoder.encode(encodeChatStreamEvent(event)));
      };

      void handleChatTurn({
        accessToken: token,
        sessionId: optionalString(record.sessionId),
        placementId: optionalString(record.placementId),
        userMessage: record.userMessage,
        seed: loadOriginalSeed(),
      }, {
        onUserMessage: ({ session, userMessage }) => send({ type: "user", session, userMessage }),
        onTextDelta: (delta) => send({ type: "delta", delta }),
      }).then((result) => {
        if (result.ok) {
          send({
            type: "done",
            session: result.session,
            userMessage: result.userMessage,
            assistantMessage: result.assistantMessage,
          });
        } else {
          send({ type: "error", error: result.message });
        }
      }).catch(() => {
        send({ type: "error", error: "Your message could not be sent. Please retry." });
      }).finally(() => {
        if (!open) return;
        open = false;
        controller.close();
      });
    },
    cancel() {
      // The handler intentionally continues so the complete turn is persisted.
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
