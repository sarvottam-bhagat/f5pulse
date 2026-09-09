"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ChatInputBar({
  onSend,
  disabled,
  variant = "compact",
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
  variant?: "welcome" | "compact";
}) {
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div aria-label="Message composer" className="w-full">
      <div
        className={`flex items-end gap-3 rounded-[2rem] bg-surface-secondary p-2.5 pl-5 transition-shadow focus-within:ring-2 focus-within:ring-accent/25 ${
          variant === "welcome" ? "min-h-[84px]" : "min-h-[64px]"
        }`}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          aria-label="Message"
          placeholder="Ask anything…"
          rows={variant === "welcome" ? 2 : 1}
          disabled={disabled}
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent py-3 text-base leading-6 text-foreground outline-none placeholder:text-text-muted disabled:cursor-not-allowed"
        />
        <Button
          variant="primary"
          aria-label="Send message"
          className="mb-0.5 h-12 w-12 shrink-0 rounded-full p-0 text-xl"
          onClick={handleSend}
          disabled={disabled || !text.trim()}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path d="M12 18V6m0 0-5 5m5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-text-muted">
        <span><kbd className="rounded bg-surface-secondary px-1.5 py-0.5">Enter</kbd> to send</span>
        <span aria-hidden="true">·</span>
        <span><kbd className="rounded bg-surface-secondary px-1.5 py-0.5">Shift + Enter</kbd> for new line</span>
      </div>
    </div>
  );
}
