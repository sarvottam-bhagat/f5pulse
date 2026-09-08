"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ContextHeader } from "@/components/chat/ContextHeader";
import { ContextPicker } from "@/components/chat/ContextPicker";
import { CapabilityBar, type CapabilityKey } from "@/components/chat/CapabilityBar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInputBar } from "@/components/chat/ChatInputBar";
import { RetryableError } from "@/components/ui/RetryableError";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStoreData } from "@/store/useStore";
import { buildPlacementContext } from "@/domain/rules";
import { resolveContextFromPlacement } from "@/domain/chat/resolveContext";
import {
  summarizePlacement,
  explainRisk,
  talkingPoints,
  compareComplaintsWithHistory,
  recommendEscalation,
  draftFeedbackRequest,
  draftComplaintResponse,
  draftCoachingEmail,
  recommendIssueResolutions,
  identifyRequiredFollowups,
} from "@/domain/chat/deterministicSummaries";
import type { ChatContextAttachment, ChatMessage, ChatViewMode } from "@/domain/chat/types";
import { buildPlacementPromptContext } from "@/domain/chat/promptContext";
import { parseAssistantResponse } from "@/domain/chat/parseResponse";
import { getDemoToday } from "@/domain/dates";

function nextMsgId() {
  return `msg_${Math.random().toString(36).slice(2)}`;
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const { seed } = useStoreData();
  const today = getDemoToday();

  const [context, setContext] = useState<ChatContextAttachment | null>(null);
  const [viewMode, setViewMode] = useState<ChatViewMode>("client");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [aiFailed, setAiFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const placementId = searchParams.get("placementId");
    if (placementId && !context) {
      const result = resolveContextFromPlacement(seed, placementId);
      if (result.context) setContext(result.context);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const ctx = useMemo(() => (context ? buildPlacementContext(seed, context.placementId) : null), [context, seed]);

  function pushMessage(msg: Omit<ChatMessage, "id" | "createdAt">) {
    setMessages((prev) => [...prev, { ...msg, id: nextMsgId(), createdAt: new Date().toISOString() }]);
  }

  function respondDeterministically(prompt: string) {
    if (!ctx) {
      pushMessage({ role: "assistant", content: "Attach a client, professional, or placement first so I know what you're asking about." });
      return;
    }
    let content = "";
    const lower = prompt.toLowerCase();
    if (lower.includes("summar")) content = summarizePlacement(ctx, today);
    else if (lower.includes("risk") || lower.includes("why")) content = explainRisk(ctx, today);
    else if (lower.includes("talking point") || lower.includes("call")) content = talkingPoints(ctx, today, viewMode).join("\n");
    else if (lower.includes("complaint") && lower.includes("attend")) content = compareComplaintsWithHistory(ctx);
    else if (lower.includes("escalat")) content = recommendEscalation(ctx, today);
    else if (lower.includes("feedback request") || lower.includes("draft feedback")) content = draftFeedbackRequest(ctx);
    else if (lower.includes("complaint response") || lower.includes("respond to")) {
      const complaint = ctx.issues.find((i) => i.source === "client_complaint");
      content = draftComplaintResponse(ctx, complaint?.description ?? "the concern raised");
    } else if (lower.includes("coaching")) {
      const concern = ctx.issues.find((i) => i.source !== "client_complaint");
      content = draftCoachingEmail(ctx, concern?.description ?? "recent performance");
    } else if (lower.includes("resolution")) content = recommendIssueResolutions(ctx).join("\n") || "No open issues to resolve.";
    else if (lower.includes("follow")) content = identifyRequiredFollowups(ctx, today).join("\n") || "No follow-ups currently required.";
    else content = summarizePlacement(ctx, today);

    pushMessage({ role: "assistant", content, isFallback: true });
  }

  async function respondWithAI(prompt: string) {
    if (!ctx) {
      pushMessage({ role: "assistant", content: "Attach a client, professional, or placement first so I know what you're asking about." });
      return;
    }
    setPending(true);
    setAiFailed(false);
    try {
      const placementContext = buildPlacementPromptContext(ctx, today, viewMode);
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placementContext, userMessage: prompt, history }),
      });

      if (!res.ok) throw new Error(`AI service returned ${res.status}`);
      const data = await res.json();
      if (!data.content) throw new Error("Empty AI response");

      const { content, proposedActions } = parseAssistantResponse(data.content, ctx.placement.id);
      pushMessage({ role: "assistant", content, proposedActions });
    } catch {
      setAiFailed(true);
      respondDeterministically(prompt);
    } finally {
      setPending(false);
    }
  }

  function handleCapability(key: CapabilityKey) {
    if (!ctx) return;
    const prompts: Record<CapabilityKey, string> = {
      summarize: "Summarize this placement",
      explain_risk: "Why is this at risk?",
      talking_points: "Give me call talking points",
      compare_complaints: "Compare complaints with attendance",
      recommend_escalation: "Should I escalate this?",
      draft_feedback_request: "Draft a feedback request",
      draft_complaint_response: "Draft a complaint response",
      draft_coaching_email: "Draft a coaching email",
      improvement_plan: "Create an improvement plan",
      recommend_resolutions: "Recommend issue resolutions",
      required_followups: "What follow-ups are needed?",
    };
    const prompt = prompts[key];
    pushMessage({ role: "user", content: prompt });
    setLastUserMessage(prompt);
    void respondWithAI(prompt);
  }

  function handleSend(text: string) {
    pushMessage({ role: "user", content: text });
    setLastUserMessage(text);
    void respondWithAI(text);
  }

  function handleRetry() {
    if (lastUserMessage) void respondWithAI(lastUserMessage);
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Chat" />
      <ContextHeader
        seed={seed}
        context={context}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onOpenPicker={() => setPickerOpen(true)}
      />

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {!context ? (
          <EmptyState
            icon="💬"
            title="Attach a placement to get started"
            description="Select a client, professional, or placement to investigate, prepare communication, and take action."
          />
        ) : messages.length === 0 ? (
          <EmptyState icon="✨" title="Ask anything about this placement" description="Try one of the shortcuts below, or type your own question." />
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        {pending && <p className="text-sm text-text-muted px-1">Thinking…</p>}
        {aiFailed && (
          <RetryableError message="The AI service is unavailable right now — showing a deterministic answer below. You can retry the AI." onRetry={handleRetry} />
        )}
      </div>

      {context && <CapabilityBar onSelect={handleCapability} disabled={pending} />}
      <ChatInputBar onSend={handleSend} disabled={!context || pending} />

      <ContextPicker
        open={pickerOpen}
        seed={seed}
        onClose={() => setPickerOpen(false)}
        onAttach={(c) => {
          setContext(c);
          setPickerOpen(false);
          setMessages([]);
        }}
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <ChatPageInner />
    </Suspense>
  );
}
