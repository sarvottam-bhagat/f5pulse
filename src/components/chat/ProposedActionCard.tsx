"use client";

import { useState } from "react";
import type { ProposedAction } from "@/domain/chat";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/store/useStore";

function describeAction(action: ProposedAction): string {
  switch (action.kind) {
    case "log_contact":
      return `Log contact with ${action.subjectType}: "${action.summary}"`;
    case "record_feedback":
      return `Record ${action.sentiment} ${action.subjectType} feedback: "${action.summary}"`;
    case "create_issue":
      return `Create ${action.severity}-severity issue: "${action.title}"`;
    case "schedule_followup":
      return `Schedule follow-up for ${action.dueDate}: "${action.description}"`;
    case "mark_fix_implemented":
      return `Mark fix implemented: "${action.fixDescription}"`;
    case "create_escalation":
      return `Escalate: "${action.summary}"`;
    case "start_replacement_review":
      return `Start replacement review: "${action.summary}"`;
  }
}

export function ProposedActionCard({ action }: { action: ProposedAction }) {
  const store = useStore();
  const [status, setStatus] = useState<"pending" | "confirmed" | "dismissed" | "error">("pending");
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    const now = new Date().toISOString();
    let result: { ok: boolean; error?: string };
    switch (action.kind) {
      case "log_contact":
        result = store.logCommunication({
          placementId: action.placementId,
          subjectType: action.subjectType,
          channel: action.channel,
          direction: "outbound",
          summary: action.summary,
          owner: "Operator",
        });
        break;
      case "record_feedback":
        result = store.recordFeedback({
          placementId: action.placementId,
          subjectType: action.subjectType,
          sentiment: action.sentiment,
          summary: action.summary,
          collectedAt: now,
        });
        break;
      case "create_issue":
        result = store.createIssue({
          placementId: action.placementId,
          title: action.title,
          description: action.description,
          source: "internal",
          severity: action.severity,
        });
        break;
      case "schedule_followup":
        result = store.logCommunication({
          placementId: action.placementId,
          subjectType: "client",
          channel: "email",
          direction: "outbound",
          summary: action.description,
          owner: "Operator",
          nextFollowUpDate: action.dueDate,
        });
        break;
      case "mark_fix_implemented":
        result = store.implementFix({ issueId: action.issueId, fixDescription: action.fixDescription, at: now });
        break;
      case "create_escalation":
        result = store.createEscalation({
          placementId: action.placementId,
          reason: "cancellation_or_replacement_mentioned",
          summary: action.summary,
        });
        break;
      case "start_replacement_review":
        result = store.createEscalation({
          placementId: action.placementId,
          reason: "cancellation_or_replacement_mentioned",
          summary: `Replacement review requested: ${action.summary}`,
        });
        break;
    }
    if (!result.ok) {
      setStatus("error");
      setError(result.error ?? "Could not complete this action.");
      return;
    }
    setStatus("confirmed");
  }

  if (status === "confirmed") {
    return (
      <div className="rounded-2xl bg-risk-low-bg px-3.5 py-2.5 text-xs text-risk-low">✓ Action applied</div>
    );
  }
  if (status === "dismissed") {
    return <div className="rounded-2xl bg-background px-3.5 py-2.5 text-xs text-text-muted">Dismissed</div>;
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent-bg px-3.5 py-3 space-y-2">
      <p className="text-xs font-medium text-accent-text">Proposed action</p>
      <p className="text-sm">{describeAction(action)}</p>
      {status === "error" && error && <p className="text-xs text-risk-critical">{error}</p>}
      <div className="flex gap-2">
        <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={() => setStatus("dismissed")}>
          Dismiss
        </Button>
        <Button variant="primary" className="text-xs px-3 py-1.5" onClick={confirm}>
          Confirm
        </Button>
      </div>
    </div>
  );
}
