"use client";

import { useState } from "react";
import { resolveDashboardLane, type PriorityCard, type PrioritySection } from "@/domain/rules";
import { PriorityCardView } from "./PriorityCardView";

const ATTENTION_FILTERS: { section: PrioritySection; label: string; color: string }[] = [
  { section: "escalate_now", label: "Escalate", color: "bg-[#ff4245]" },
  { section: "contact_today", label: "Contact", color: "bg-[#0071e3]" },
  { section: "confirm_fix_held", label: "Confirm", color: "bg-[#ff9f0a]" },
];

function EmptyLane({ message }: { message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#04b862]/10 text-[#07894c]" aria-hidden="true">
        ✓
      </span>
      <p className="text-sm font-semibold">All caught up</p>
      <p className="mt-1 max-w-52 text-xs leading-relaxed text-text-muted">{message}</p>
    </div>
  );
}

function PriorityLane({
  id,
  title,
  description,
  cards,
  onPrimaryAction,
  className,
  children,
}: {
  id: string;
  title: string;
  description: string;
  cards: PriorityCard[];
  onPrimaryAction: (card: PriorityCard) => void;
  className: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className={`${className} h-[540px] min-w-0 flex-col overflow-hidden rounded-[28px] bg-surface-secondary`}>
      <header className="shrink-0 border-b border-border/60 px-5 pb-4 pt-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#1d1d1f] px-2 text-xs font-semibold text-white tabular-nums">
                {cards.length}
              </span>
              <h2 className="text-lg font-semibold tracking-[-0.025em]">{title}</h2>
            </div>
            <p className="mt-1.5 text-xs text-text-muted">{description}</p>
          </div>
        </div>
        {children}
      </header>

      {cards.length === 0 ? (
        <EmptyLane message={id === "attention-lane" ? "Nothing needs immediate attention." : "Nothing is scheduled in the next three days."} />
      ) : (
        <div role="list" className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 scrollbar-thin sm:p-4">
          {cards.map((card) => (
            <PriorityCardView key={card.id} card={card} onPrimaryAction={onPrimaryAction} />
          ))}
        </div>
      )}
    </section>
  );
}

export function OperationsWorkspace({
  attention,
  upcoming,
  onPrimaryAction,
}: {
  attention: PriorityCard[];
  upcoming: PriorityCard[];
  onPrimaryAction: (card: PriorityCard) => void;
}) {
  const [mobileLane, setMobileLane] = useState<"attention" | "upcoming">("attention");
  const visibleLane = resolveDashboardLane(mobileLane, attention.length, upcoming.length);

  return (
    <section aria-labelledby="operations-title">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 id="operations-title" className="text-xl font-semibold tracking-[-0.03em]">Today’s operations</h2>
          <p className="mt-1 text-sm text-text-muted">Act on current risk first, then prepare what comes next.</p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 rounded-full bg-surface-secondary p-1 lg:hidden">
        <button
          type="button"
          aria-controls="attention-lane"
          aria-pressed={visibleLane === "attention"}
          onClick={() => setMobileLane("attention")}
          className={`tap-target rounded-full px-4 text-sm font-medium transition-colors ${visibleLane === "attention" ? "bg-[#1d1d1f] text-white" : "text-text-secondary"}`}
        >
          Needs attention ({attention.length})
        </button>
        <button
          type="button"
          aria-controls="upcoming-lane"
          aria-pressed={visibleLane === "upcoming"}
          onClick={() => setMobileLane("upcoming")}
          className={`tap-target rounded-full px-4 text-sm font-medium transition-colors ${visibleLane === "upcoming" ? "bg-[#1d1d1f] text-white" : "text-text-secondary"}`}
        >
          Next up ({upcoming.length})
        </button>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
        <PriorityLane
          id="attention-lane"
          title="Needs attention"
          description="Escalations, contacts and confirmations due now"
          cards={attention}
          onPrimaryAction={onPrimaryAction}
          className={visibleLane === "attention" ? "flex" : "hidden lg:flex"}
        >
          <div className="mt-4 flex flex-wrap gap-2">
            {ATTENTION_FILTERS.map((filter) => {
              const count = attention.filter((card) => card.section === filter.section).length;
              return (
                <span key={filter.section} className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                  <span className={`h-1.5 w-1.5 rounded-full ${filter.color}`} />
                  {filter.label} {count}
                </span>
              );
            })}
          </div>
        </PriorityLane>

        <PriorityLane
          id="upcoming-lane"
          title="Next up"
          description="Client and professional check-ins in the next three days"
          cards={upcoming}
          onPrimaryAction={onPrimaryAction}
          className={visibleLane === "upcoming" ? "flex" : "hidden lg:flex"}
        />
      </div>
    </section>
  );
}
