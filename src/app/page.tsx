"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ActionSheet } from "@/components/dashboard/ActionSheet";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { OperationsWorkspace } from "@/components/dashboard/OperationsWorkspace";
import { PlacementHealthCard } from "@/components/dashboard/PlacementHealthCard";
import { SummaryTiles } from "@/components/dashboard/SummaryTiles";
import { WorkflowClosureSection } from "@/components/dashboard/WorkflowClosureSection";
import { MalformedRecordBanner, StorageFailureBanner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  buildAllPlacementContexts,
  buildDashboardLanes,
  buildHealthDistribution,
  buildEscalationTracker,
  buildFollowupQueue,
  buildPriorityQueue,
  buildSummaryTiles,
  filterByTile,
  type PriorityCard,
  type SummaryTileKey,
} from "@/domain/rules";
import { formatHuman, getDemoToday } from "@/domain/dates";
import { useMalformedRecordCount, useStorageMode, useStore, useStoreData } from "@/store/useStore";

export default function HomePage() {
  const { seed } = useStoreData();
  const store = useStore();
  const storageMode = useStorageMode();
  const malformedCount = useMalformedRecordCount();
  const [activeFilter, setActiveFilter] = useState<SummaryTileKey | null>(null);
  const [activeCard, setActiveCard] = useState<PriorityCard | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const today = getDemoToday();

  const contexts = useMemo(() => buildAllPlacementContexts(seed), [seed]);
  const tiles = useMemo(() => buildSummaryTiles(contexts, today), [contexts, today]);
  const filteredContexts = useMemo(
    () => (activeFilter ? filterByTile(contexts, activeFilter, today) : contexts),
    [contexts, activeFilter, today],
  );
  const cards = useMemo(() => buildPriorityQueue(filteredContexts, today), [filteredContexts, today]);
  const lanes = useMemo(() => buildDashboardLanes(cards), [cards]);
  const healthDistribution = useMemo(() => buildHealthDistribution(contexts, today), [contexts, today]);
  const followupQueue = useMemo(() => buildFollowupQueue(contexts, today), [contexts, today]);
  const escalationTracker = useMemo(() => buildEscalationTracker(contexts), [contexts]);

  if (contexts.length === 0) {
    return (
      <main className="pb-8">
        <EmptyState
          icon="👋"
          title="No active placements yet"
          description="Add your first placement to start monitoring client happiness and professional performance."
          action={(
            <Link
              href="/placements/new"
              className="tap-target inline-flex items-center rounded-full bg-[#0071e3] px-5 text-sm font-medium text-white"
            >
              Add Placement
            </Link>
          )}
        />
      </main>
    );
  }

  function resetDemoData() {
    store.resetDemoData();
    setActiveFilter(null);
    setConfirmingReset(false);
  }

  return (
    <main className="space-y-10 pb-8">
      {storageMode === "temporary" && <StorageFailureBanner />}
      {malformedCount > 0 && <MalformedRecordBanner count={malformedCount} />}

      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{formatHuman(today)}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
            Who needs your attention today?
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {confirmingReset ? (
            <>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className="tap-target rounded-full px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={resetDemoData}
                className="tap-target rounded-full bg-risk-critical px-4 text-sm font-medium text-white"
              >
                Confirm reset
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className="tap-target rounded-full px-4 text-sm font-medium text-text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
            >
              Reset demo
            </button>
          )}
          <Link
            href="/placements/new"
            className="tap-target inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-5 text-sm font-medium text-white shadow-[0_6px_18px_rgba(0,113,227,0.18)] transition-all hover:bg-[#0076df] active:scale-[0.98]"
          >
            <span className="text-lg font-light leading-none" aria-hidden="true">+</span>
            Add Placement
          </Link>
        </div>
      </header>

      <SummaryTiles
        tiles={tiles}
        portfolioTotals={{
          clients: seed.clients.filter((client) => !client.archived).length,
          professionals: seed.professionals.filter((professional) => !professional.archived).length,
        }}
        activeFilter={activeFilter}
        onToggleFilter={(key) => setActiveFilter((current) => (current === key ? null : key))}
      />

      {activeFilter && (
        <div className="-mt-6 flex items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-sm">
          <span className="text-text-secondary">Showing the selected summary filter</span>
          <button type="button" onClick={() => setActiveFilter(null)} className="font-medium text-accent">
            Clear filter
          </button>
        </div>
      )}

      <OperationsWorkspace
        attention={lanes.attention}
        upcoming={lanes.upcoming}
        onPrimaryAction={setActiveCard}
      />

      <WorkflowClosureSection
        followups={followupQueue}
        escalations={escalationTracker}
        onCompleteFollowup={(followupId, outcome) => {
          const result = store.completeFollowup({
            followupId,
            outcome,
            completedAt: new Date().toISOString(),
          });
          return result.ok ? { ok: true } : result;
        }}
        onUpdateEscalation={(escalationId, status) => {
          const result = store.updateEscalationStatus(escalationId, status);
          return result.ok ? { ok: true } : result;
        }}
      />

      <section aria-labelledby="overview-title">
        <div className="mb-5">
          <h2 id="overview-title" className="text-xl font-semibold tracking-[-0.03em]">Operational overview</h2>
          <p className="mt-1 text-sm text-text-muted">Placement health, trial timing and issue progress at a glance.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <PlacementHealthCard distribution={healthDistribution} />
          <InsightsSection contexts={contexts} today={today} />
        </div>
      </section>

      <ActionSheet card={activeCard} onClose={() => setActiveCard(null)} />
    </main>
  );
}
