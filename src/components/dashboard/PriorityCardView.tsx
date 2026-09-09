"use client";

import Link from "next/link";
import type { PriorityCard, RecommendedAction } from "@/domain/rules";
import { RiskBadge } from "@/components/ui/RiskBadge";
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
    <article
      role="listitem"
      className="rounded-2xl border border-transparent bg-background p-4 transition-colors hover:border-border"
      title={card.whyHere}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight tracking-[-0.015em]">{card.clientName}</p>
          <p className="mt-0.5 truncate text-xs text-text-muted">{card.professionalName}</p>
        </div>
        <RiskBadge level={card.riskLevel} />
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-snug text-foreground">{card.reason}</p>
      {card.evidence[0] && <p className="mt-1 truncate text-xs text-text-muted">{card.evidence[0]}</p>}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
        <p className="text-[11px] font-medium text-text-muted">
          Contact {card.contactWho === "client" ? "client" : "professional"} · {formatHuman(card.dueAt.slice(0, 10))}
        </p>
        <div className="flex items-center gap-1.5">
          <Link
            href={`/chat?placementId=${card.placementId}`}
            className="tap-target inline-flex items-center rounded-full px-2.5 text-xs font-medium text-accent transition-colors hover:bg-accent-bg"
          >
            Chat
          </Link>
          <Link
            href={`/placements/${card.placementId}`}
            className="tap-target inline-flex items-center rounded-full px-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
          >
            View
          </Link>
          <button
            type="button"
            onClick={() => onPrimaryAction(card)}
            className="tap-target inline-flex items-center rounded-full bg-[#1d1d1f] px-3 text-xs font-medium text-white transition-transform active:scale-[0.98]"
          >
            {ACTION_LABELS[card.recommendedAction]}
          </button>
        </div>
      </div>
    </article>
  );
}
