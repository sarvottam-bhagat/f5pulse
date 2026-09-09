"use client";

import { useState } from "react";
import Link from "next/link";
import type { EscalationStatus } from "@/domain/types";
import type { EscalationTrackerItem, FollowupQueueItem } from "@/domain/rules";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

type ActionResult = { ok: true } | { ok: false; error: string };

const FOLLOWUP_TIMING_LABELS: Record<FollowupQueueItem["timing"], string> = {
  overdue: "Overdue",
  today: "Due today",
  upcoming: "Upcoming",
};

function escalationStatusLabel(item: EscalationTrackerItem): string {
  if (item.status === "open") return `Awaiting ${item.escalatedTo}`;
  if (item.status === "acknowledged") return `Acknowledged by ${item.escalatedTo}`;
  return "Resolved";
}

export function WorkflowClosureSection({
  followups,
  escalations,
  onCompleteFollowup,
  onUpdateEscalation,
}: {
  followups: FollowupQueueItem[];
  escalations: EscalationTrackerItem[];
  onCompleteFollowup: (followupId: string, outcome: string) => ActionResult;
  onUpdateEscalation: (escalationId: string, status: EscalationStatus) => ActionResult;
}) {
  const [activeFollowup, setActiveFollowup] = useState<FollowupQueueItem | null>(null);
  const [outcome, setOutcome] = useState("");
  const [error, setError] = useState<string | null>(null);

  function closeFollowup() {
    setActiveFollowup(null);
    setOutcome("");
    setError(null);
  }

  function completeFollowup() {
    if (!activeFollowup) return;
    if (!outcome.trim()) {
      setError("Add a short outcome before completing this follow-up.");
      return;
    }
    const result = onCompleteFollowup(activeFollowup.followupId, outcome.trim());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    closeFollowup();
  }

  function updateEscalation(escalationId: string, status: EscalationStatus) {
    const result = onUpdateEscalation(escalationId, status);
    if (!result.ok) setError(result.error);
  }

  return (
    <section aria-labelledby="follow-through-title">
      <div className="mb-5">
        <h2 id="follow-through-title" className="text-xl font-semibold tracking-[-0.03em]">Follow-through</h2>
        <p className="mt-1 text-sm text-text-muted">Close the loop on promised follow-ups and senior escalations.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[28px] bg-surface-secondary">
          <header className="border-b border-border/60 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#1d1d1f] px-2 text-xs font-semibold text-white tabular-nums">
                {followups.length}
              </span>
              <h3 className="text-lg font-semibold tracking-[-0.025em]">Follow-up queue</h3>
            </div>
            <p className="mt-1.5 text-xs text-text-muted">Open commitments ordered by due date.</p>
          </header>

          <div className="max-h-[430px] space-y-2 overflow-y-auto p-3 sm:p-4">
            {followups.length === 0 ? (
              <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-text-muted">No open follow-ups.</p>
            ) : followups.map((item) => (
              <article key={item.followupId} className="rounded-2xl bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.description}</p>
                    <p className="mt-1 text-xs text-text-muted">{item.clientName} · {item.professionalName}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${item.timing === "overdue" ? "bg-risk-critical-bg text-risk-critical" : item.timing === "today" ? "bg-accent-bg text-accent-text" : "bg-surface-secondary text-text-secondary"}`}>
                    {FOLLOWUP_TIMING_LABELS[item.timing]}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                  <p className="text-xs text-text-muted">Owner: {item.owner} · {item.dueDate}</p>
                  <Button variant="primary" className="px-4 py-2 text-xs" onClick={() => setActiveFollowup(item)}>
                    Complete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] bg-surface-secondary">
          <header className="border-b border-border/60 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-[#1d1d1f] px-2 text-xs font-semibold text-white tabular-nums">
                {escalations.filter((item) => item.status !== "resolved").length}
              </span>
              <h3 className="text-lg font-semibold tracking-[-0.025em]">Escalation tracking</h3>
            </div>
            <p className="mt-1.5 text-xs text-text-muted">Raised items stay visible through resolution.</p>
          </header>

          <div className="max-h-[430px] space-y-2 overflow-y-auto p-3 sm:p-4">
            {escalations.length === 0 ? (
              <p className="rounded-2xl bg-background px-4 py-8 text-center text-sm text-text-muted">No recorded escalations.</p>
            ) : escalations.map((item) => (
              <article key={item.escalationId} className={`rounded-2xl bg-background p-4 ${item.status === "resolved" ? "opacity-65" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.clientName}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{item.professionalName}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${item.status === "open" ? "bg-risk-critical-bg text-risk-critical" : item.status === "acknowledged" ? "bg-accent-bg text-accent-text" : "bg-risk-low-bg text-risk-low"}`}>
                    {escalationStatusLabel(item)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-text-secondary">{item.summary}</p>
                <p className="mt-2 text-xs text-text-muted">{item.raisedBy} → {item.escalatedTo}</p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                  <Link href={`/placements/${item.placementId}`} className="text-xs font-medium text-accent">View placement</Link>
                  {item.status === "open" && (
                    <Button variant="secondary" className="px-4 py-2 text-xs" onClick={() => updateEscalation(item.escalationId, "acknowledged")}>
                      Mark acknowledged
                    </Button>
                  )}
                  {item.status === "acknowledged" && (
                    <Button variant="primary" className="px-4 py-2 text-xs" onClick={() => updateEscalation(item.escalationId, "resolved")}>
                      Resolve
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
          {error && <p className="px-5 pb-4 text-xs text-risk-critical">{error}</p>}
        </div>
      </div>

      <BottomSheet open={!!activeFollowup} onClose={closeFollowup} title="Complete follow-up">
        {activeFollowup && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">{activeFollowup.description}</p>
              <p className="mt-1 text-xs text-text-muted">{activeFollowup.clientName} · {activeFollowup.professionalName}</p>
            </div>
            <div>
              <label htmlFor="followup-outcome" className="text-xs font-medium text-text-secondary">Outcome</label>
              <textarea
                id="followup-outcome"
                value={outcome}
                onChange={(event) => setOutcome(event.target.value)}
                rows={3}
                placeholder="What happened and what is the next step?"
                className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm"
              />
            </div>
            {error && <p className="text-xs text-risk-critical">{error}</p>}
            <div className="flex gap-2">
              <Button variant="secondary" fullWidth onClick={closeFollowup}>Cancel</Button>
              <Button variant="primary" fullWidth onClick={completeFollowup}>Complete</Button>
            </div>
          </div>
        )}
      </BottomSheet>
    </section>
  );
}
