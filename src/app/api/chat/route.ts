import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CHAT_SYSTEM_PROMPT } from "@/domain/chat/promptContext";

export const runtime = "nodejs";

interface ChatRequestBody {
  placementContext: string;
  userMessage: string;
  history: { role: "user" | "assistant"; content: string }[];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI service is not configured." }, { status: 503 });
  }

  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { placementContext, userMessage, history } = body;
  if (!userMessage || typeof userMessage !== "string") {
    return NextResponse.json({ error: "Missing userMessage." }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system: `${CHAT_SYSTEM_PROMPT}\n\nPLACEMENT CONTEXT:\n${placementContext}`,
      messages: [
        ...(history ?? []).map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: userMessage },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";

    return NextResponse.json({ content: text });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "AI service failed." }, { status: 502 });
  }
}
