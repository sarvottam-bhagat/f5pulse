"use client";

import type { ChatSession } from "@/domain/chat";
import type { Seed } from "@/domain/types";

function sessionDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ConversationSidebar({
  seed,
  sessions,
  activeSessionId,
  loading,
  error,
  onRetry,
  onDelete,
  onSelect,
  onNew,
  onClose,
}: {
  seed: Seed;
  sessions: ChatSession[];
  activeSessionId: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onDelete: (sessionId: string) => void;
  onSelect: (sessionId: string) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white px-3 pb-4 pt-24">
      <div className="mb-4 flex items-center gap-2 px-1">
        <h2 className="flex-1 text-base font-semibold tracking-[-0.02em]">Conversations</h2>
        <button
          type="button"
          onClick={onNew}
          aria-label="New conversation"
          title="New conversation"
          className="tap-target flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close conversations"
          title="Close conversations"
          className="tap-target flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-secondary"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M9 5H5v14h4M13 8l4 4-4 4M7 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <div className="rounded-[1.5rem] bg-surface-secondary px-4 py-5">
            <p className="text-sm font-medium">Loading conversations…</p>
            <p className="mt-1 text-xs leading-5 text-text-muted">Restoring your private chat history.</p>
          </div>
        ) : error ? (
          <div className="rounded-[1.5rem] bg-surface-secondary px-4 py-5">
            <p className="text-sm font-medium">Chat history is temporarily unavailable.</p>
            <button type="button" onClick={onRetry} className="mt-3 text-xs font-medium text-accent-blue">Retry</button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-[1.5rem] bg-surface-secondary px-4 py-5">
            <p className="text-sm font-medium">No conversations yet</p>
            <p className="mt-1 text-xs leading-5 text-text-muted">Ask generally, or use @ and / for placement context.</p>
          </div>
        ) : (
          sessions.map((session) => {
            const client = seed.clients.find((item) => item.id === session.context?.clientId);
            const professional = seed.professionals.find((item) => item.id === session.context?.professionalId);
            const selected = session.id === activeSessionId;

            return (
              <div
                key={session.id}
                className={`group relative overflow-hidden rounded-[1.4rem] transition-colors ${
                  selected ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary hover:brightness-[0.98]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(session.id)}
                  className="tap-target w-full px-4 py-3.5 pr-11 text-left"
                >
                  <span className="flex items-start gap-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{session.title}</span>
                      <span className={`mt-1 block truncate text-xs ${selected ? "text-white/65" : "text-text-muted"}`}>
                        {session.context
                          ? `${client?.companyName ?? "Client"} · ${professional?.fullName ?? "Professional"}`
                          : "General operations"}
                      </span>
                    </span>
                    <time className={`shrink-0 pt-0.5 text-[10px] ${selected ? "text-white/55" : "text-text-muted"}`}>
                      {sessionDate(session.updatedAt)}
                    </time>
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${session.title}`}
                  title="Delete conversation"
                  onClick={() => onDelete(session.id)}
                  className={`absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-sm transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 ${selected ? "text-white/70 hover:bg-white/10" : "text-text-muted hover:bg-white"}`}
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>

      <p className="px-2 pt-3 text-[10px] leading-4 text-text-muted">
        Your conversations are saved privately.
      </p>
    </div>
  );
}
