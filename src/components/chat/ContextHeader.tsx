"use client";

import type { Seed } from "@/domain/types";
import type { ChatContextAttachment, ChatViewMode } from "@/domain/chat";

export function ContextHeader({
  seed,
  context,
  viewMode,
  onChangeViewMode,
  onOpenPicker,
}: {
  seed: Seed;
  context: ChatContextAttachment | null;
  viewMode: ChatViewMode;
  onChangeViewMode: (mode: ChatViewMode) => void;
  onOpenPicker: () => void;
}) {
  const client = context ? seed.clients.find((c) => c.id === context.clientId) : null;
  const professional = context ? seed.professionals.find((p) => p.id === context.professionalId) : null;

  return (
    <div aria-label="Chat context" className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        onClick={onOpenPicker}
        className="tap-target min-w-0 max-w-full rounded-full border border-border bg-white px-4 text-left transition-colors hover:bg-surface-secondary"
      >
        {context ? (
          <div className="truncate">
            <span className="text-xs font-medium">{client?.companyName}</span>
            <span className="text-xs text-text-muted"> · {professional?.fullName}</span>
          </div>
        ) : (
          <span className="text-xs font-medium text-accent">+ Attach placement context</span>
        )}
      </button>

      {context && (
        <div className="flex shrink-0 gap-1 rounded-full bg-surface-secondary p-1">
          <button
            onClick={() => onChangeViewMode("client")}
            className={`tap-target rounded-full px-3 text-xs font-medium ${viewMode === "client" ? "bg-[#1d1d1f] text-white" : "text-text-muted"}`}
          >
            Client
          </button>
          <button
            onClick={() => onChangeViewMode("professional")}
            className={`tap-target rounded-full px-3 text-xs font-medium ${viewMode === "professional" ? "bg-[#1d1d1f] text-white" : "text-text-muted"}`}
          >
            Professional
          </button>
        </div>
      )}
    </div>
  );
}
