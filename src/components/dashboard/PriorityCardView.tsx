"use client";

import Link from "next/link";
import type { PriorityCard, RecommendedAction } from "@/domain/rules";
import { RiskBadge } from "@/components/ui/RiskBadge";
import { Button } from "@/components/ui/Button";
import { formatHuman } from "@/domain/dates";

const ACTION_LABELS: Record<RecommendedAction, string> = {
  log_outcome: "Log outcome",
  record_feedback: "Record feedback",
  investigate_in_chat: "Investigate in Chat",
  create_issue: "Create issue",
  schedule_followup: "Schedule follow-up",
  escalate: "Escalate",
  confirm_fix: "Confirm fix held",
};

export function PriorityCardView({
  card,
  onPrimaryAction,
}: {
  card: PriorityCard;
  onPrimaryAction: (card: PriorityCard) => void;
}) {
  return (
    <div className="rounded-[20px] bg-surface-secondary p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold leading-tight tracking-[-0.01em] truncate">{card.clientName}</p>
          <p className="text-sm text-text-muted truncate">{card.professionalName}</p>
        </div>
        <RiskBadge level={card.riskLevel} />
      </div>

      <div>
        <p className="text-xs font-medium text-text-muted">
          Contact: <span className="text-foreground">{card.contactWho === "client" ? "Client" : "Professional"}</span>
        </p>
        <p className="text-sm">{card.reason}</p>
      </div>

      {card.evidence.length > 0 && (
        <ul className="space-y-1 rounded-2xl bg-background px-3 py-2 text-xs text-text-secondary">
          {card.evidence.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>Due {formatHuman(card.dueAt.slice(0, 10))}</span>
      </div>

      <details className="text-xs text-text-muted">
        <summary className="cursor-pointer select-none font-medium text-accent">Why this is here</summary>
        <p className="mt-1">{card.whyHere}</p>
      </details>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="primary" className="text-xs px-3 py-2" onClick={() => onPrimaryAction(card)}>
          {ACTION_LABELS[card.recommendedAction]}
        </Button>
        <Link href={`/chat?placementId=${card.placementId}`}>
          <Button variant="secondary" className="text-xs px-3 py-2">
            Investigate in Chat
          </Button>
        </Link>
        <Link href={`/placements/${card.placementId}`}>
          <Button variant="ghost" className="text-xs px-3 py-2">
            View placement
          </Button>
        </Link>
      </div>
    </div>
  );
}
