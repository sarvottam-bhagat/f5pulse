"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/store/useStore";
import { getIntegrationAdapter } from "@/domain/integrations/types";
import type { Communication } from "@/domain/types";

export function DraftCommunicationCard({ communication }: { communication: Communication }) {
  const store = useStore();
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");

  const alreadySent = !!communication.markedSentAt;
  const adapter = getIntegrationAdapter(communication.channel === "slack" ? "slack" : "gmail");

  async function handleCopy() {
    if (!communication.draftBody) return;
    try {
      await navigator.clipboard.writeText(communication.draftBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  async function handleMarkSent() {
    setSending(true);
    setError(null);
    try {
      // Demo adapter always succeeds; a live adapter's failure here must
      // never block marking the draft as sent manually.
      await adapter.createDraft({ to: "", body: communication.draftBody ?? "" });
    } catch {
      // integration failure is swallowed — manual mark-as-sent still proceeds
    }
    const result = store.markCommunicationSent(communication.id, nextFollowUpDate || undefined);
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
  }

  return (
    <div className="rounded-2xl bg-surface-secondary p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-text-muted capitalize">{communication.channel} draft</p>
        {alreadySent && <span className="text-xs font-medium text-risk-low">Sent</span>}
      </div>
      <p className="text-sm whitespace-pre-wrap">{communication.draftBody}</p>
      {!alreadySent && (
        <>
          <div className="flex gap-2">
            <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy draft"}
            </Button>
            <Button variant="primary" className="text-xs px-3 py-1.5" onClick={handleMarkSent} disabled={sending}>
              {sending ? "Marking sent…" : "Mark as sent"}
            </Button>
          </div>
          {error && <p className="text-xs text-risk-critical">{error}</p>}
        </>
      )}
    </div>
  );
}
