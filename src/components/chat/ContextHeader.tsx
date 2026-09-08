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
    <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border">
      <button onClick={onOpenPicker} className="tap-target flex-1 min-w-0 text-left">
        {context ? (
          <div className="truncate">
            <span className="text-sm font-medium">{client?.companyName}</span>
            <span className="text-sm text-text-muted"> · {professional?.fullName}</span>
          </div>
        ) : (
          <span className="text-sm text-accent font-medium">+ Attach context</span>
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
