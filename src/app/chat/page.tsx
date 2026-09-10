"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CapabilityBar, type CapabilityKey } from "@/components/chat/CapabilityBar";
import { ChatContextComposer } from "@/components/chat/ChatContextComposer";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { RetryableError } from "@/components/ui/RetryableError";
import type { ChatContextAttachment } from "@/domain/chat";
import { resolveContextFromPlacement } from "@/domain/chat/resolveContext";
import { usePersistentChat } from "@/hooks/usePersistentChat";
import { useStoreData } from "@/store/useStore";

const SUGGESTIONS: { key: CapabilityKey; label: string }[] = [
  { key: "summarize", label: "Summarize this placement" },
  { key: "explain_risk", label: "Why is this placement at risk?" },
  { key: "talking_points", label: "Give me call talking points" },
  { key: "draft_feedback_request", label: "Draft a client feedback request" },
  { key: "required_followups", label: "What follow-ups are needed?" },
  { key: "recommend_escalation", label: "Should this be escalated?" },
];

const GENERAL_SUGGESTIONS = [
  "Who needs my attention today?",
  "Which clients should I contact today?",
  "How many placements are at risk?",
  "Which issues need escalation?",
  "What follow-ups are due?",
  "Summarize portfolio health",
];

const CAPABILITY_PROMPTS: Record<CapabilityKey, string> = {
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

function ChatPageInner() {
  const searchParams = useSearchParams();
  const { seed } = useStoreData();
  const chat = usePersistentChat();
  const [draftContext, setDraftContext] = useState<ChatContextAttachment | null>(() => {
    const placementId = searchParams.get("placementId");
    return placementId ? resolveContextFromPlacement(seed, placementId).context : null;
  });
  const [draftClientId, setDraftClientId] = useState<string | null>(() => {
    const placementId = searchParams.get("placementId");
    return placementId ? resolveContextFromPlacement(seed, placementId).context?.clientId ?? null : null;
  });
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSession = chat.activeSession;
  const context = activeSession?.context ?? draftContext;
  const selectedClientId = activeSession?.context?.clientId ?? draftClientId;
  const messages = chat.messages;
  const currentPending = chat.pending;
  const currentFailed = Boolean(chat.sendError);
  const hasConversation = messages.length > 0;
  const welcomeSuggestions = context
    ? SUGGESTIONS.map((suggestion) => ({
        label: suggestion.label,
        prompt: CAPABILITY_PROMPTS[suggestion.key],
      }))
    : GENERAL_SUGGESTIONS.map((prompt) => ({ label: prompt, prompt }));

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "auto" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [messages]);

  function scrollToLatest(behavior: ScrollBehavior = "smooth") {
    window.setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }, 0);
  }

  function handleSend(prompt: string) {
    void chat.sendMessage({ context, userMessage: prompt });
  }

  function handleCapability(key: CapabilityKey) {
    if (!context) return;
    handleSend(CAPABILITY_PROMPTS[key]);
  }

  function handleRetry() {
    void chat.retry().then(() => scrollToLatest());
  }

  function startNewConversation() {
    chat.startNewConversation();
    setDraftContext(null);
    setDraftClientId(null);
    setMobileSidebarOpen(false);
  }

  function selectSession(sessionId: string) {
    setDraftContext(null);
    setDraftClientId(null);
    setMobileSidebarOpen(false);
    void chat.selectSession(sessionId).then(() => scrollToLatest("auto"));
  }

  function selectClientContext(clientId: string) {
    chat.startNewConversation();
    setDraftClientId(clientId);
    setDraftContext(null);
  }

  function attachProfessionalContext(attachedContext: ChatContextAttachment) {
    chat.startNewConversation();
    setDraftClientId(attachedContext.clientId);
    setDraftContext(attachedContext);
  }

  function clearClientContext() {
    chat.startNewConversation();
    setDraftClientId(null);
    setDraftContext(null);
  }

  function clearProfessionalContext() {
    chat.startNewConversation();
    setDraftClientId(selectedClientId);
    setDraftContext(null);
  }

  const composer = (variant: "welcome" | "compact", disabled = false) => (
    <ChatContextComposer
      seed={seed}
      context={context}
      selectedClientId={selectedClientId}
      onSelectClient={selectClientContext}
      onAttachContext={attachProfessionalContext}
      onClearClient={clearClientContext}
      onClearProfessional={clearProfessionalContext}
      onSend={handleSend}
      disabled={disabled || chat.status !== "ready"}
      variant={variant}
    />
  );

  const sidebar = (
    <ConversationSidebar
      seed={seed}
      sessions={chat.sessions}
      activeSessionId={activeSession?.id ?? null}
      loading={chat.status === "loading"}
      error={chat.historyError}
      onRetry={() => void chat.retryHistory()}
      onDelete={(sessionId) => void chat.deleteSession(sessionId)}
      onSelect={selectSession}
      onNew={startNewConversation}
      onClose={() => {
        setDesktopSidebarOpen(false);
        setMobileSidebarOpen(false);
      }}
    />
  );

  return (
    <div className="fixed inset-0 z-30 overflow-hidden bg-white">
      {desktopSidebarOpen && <aside className="absolute inset-y-0 left-0 z-40 hidden w-[264px] border-r border-border bg-white md:block">{sidebar}</aside>}
      {mobileSidebarOpen && (
        <>
          <button type="button" aria-label="Close conversations" onClick={() => setMobileSidebarOpen(false)} className="absolute inset-0 z-[59] bg-black/15 md:hidden" />
          <aside className="absolute inset-y-0 left-0 z-[60] w-[min(86vw,320px)] border-r border-border bg-white shadow-2xl md:hidden">{sidebar}</aside>
        </>
      )}
      {!mobileSidebarOpen && (
        <button type="button" onClick={() => setMobileSidebarOpen(true)} aria-label="Open conversations" className="tap-target absolute left-4 top-24 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white shadow-sm md:hidden">
          <SidebarIcon />
        </button>
      )}
      {!desktopSidebarOpen && (
        <button type="button" onClick={() => setDesktopSidebarOpen(true)} aria-label="Open conversations" className="tap-target absolute left-6 top-6 z-40 hidden h-11 w-11 items-center justify-center rounded-full border border-border bg-white shadow-sm md:flex">
          <SidebarIcon />
        </button>
      )}

      <main className={`h-full transition-[padding] duration-200 ${desktopSidebarOpen ? "md:pl-[264px]" : "md:pl-0"}`}>
        {hasConversation ? (
          <div className="flex h-full min-h-0 flex-col">
            <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-28 sm:px-6">
              <div className="mx-auto w-full max-w-3xl space-y-5">
                {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
                {currentFailed && <RetryableError message={chat.sendError ?? "The response could not be completed."} onRetry={handleRetry} />}
              </div>
            </div>
            <div className="border-t border-border/70 bg-white px-3 pb-4 pt-2 sm:px-6">
              <div className="mx-auto w-full max-w-3xl">
                {context && <CapabilityBar onSelect={handleCapability} disabled={currentPending} />}
                {composer("compact", currentPending)}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-4 pb-8 pt-28 sm:px-8">
            <div className="w-full max-w-3xl text-center">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-text-muted">F5 operations assistant</p>
              <h1 className="text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">What can I help you with?</h1>
              <div className="mt-7">{composer("welcome")}</div>
              {currentFailed && <div className="mx-auto mt-4 max-w-2xl text-left"><RetryableError message={chat.sendError ?? "The response could not be completed."} onRetry={handleRetry} /></div>}
              <div className="mx-auto mt-7 flex max-w-2xl flex-wrap justify-center gap-2">
                {welcomeSuggestions.map((suggestion) => (
                  <button type="button" key={suggestion.prompt} onClick={() => handleSend(suggestion.prompt)} disabled={currentPending || chat.status !== "ready"} className="tap-target rounded-full border border-border bg-white px-4 text-sm text-text-secondary transition-colors hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-45">
                    {suggestion.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

function SidebarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 4v16" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function ChatPage() {
  return <Suspense fallback={<div className="fixed inset-0 bg-white" />}><ChatPageInner /></Suspense>;
}
