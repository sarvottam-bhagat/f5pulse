"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ChatInputBar({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-surface/95 backdrop-blur-xl p-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Ask about this placement…"
        rows={1}
        disabled={disabled}
        className="max-h-28 flex-1 resize-none rounded-2xl bg-surface-secondary px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent"
      />
      <Button variant="primary" className="px-4" onClick={handleSend} disabled={disabled || !text.trim()}>
        Send
      </Button>
    </div>
  );
}
