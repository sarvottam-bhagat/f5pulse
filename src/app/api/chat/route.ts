import { NextRequest, NextResponse } from "next/server";
import { createUserScopedSupabase } from "@/lib/supabase/server";
import { ChatRepository } from "@/services/chat/chatRepository";
import {
  createChatTurnHandler,
  readBearerToken,
} from "@/services/chat/chatTurnHandler";
import { runOpenAIAgent } from "@/services/chat/openaiAgent";
import { loadOriginalSeed } from "@/store/seedData";

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
  runAgent: ({ instructions, input }) => runOpenAIAgent({ instructions, input }),
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
  const result = await handleChatTurn({
    accessToken: token,
    sessionId: optionalString(record.sessionId),
    placementId: optionalString(record.placementId),
    userMessage: record.userMessage,
    seed: loadOriginalSeed(),
  });

  return NextResponse.json(
    result.ok ? result : { error: result.message },
    { status: result.ok ? 200 : result.status },
  );
}
