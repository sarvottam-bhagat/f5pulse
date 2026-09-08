"use client";

import { useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { SummaryTiles } from "@/components/dashboard/SummaryTiles";
import { PriorityCardView } from "@/components/dashboard/PriorityCardView";
import { PlacementHealthCard } from "@/components/dashboard/PlacementHealthCard";
import { InsightsSection } from "@/components/dashboard/InsightsSection";
import { ActionSheet } from "@/components/dashboard/ActionSheet";
import { AllCaughtUpState } from "@/components/ui/EmptyState";
import { StorageFailureBanner, MalformedRecordBanner } from "@/components/ui/Banner";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useStoreData, useStorageMode, useMalformedRecordCount } from "@/store/useStore";
import {
  buildAllPlacementContexts,
  buildSummaryTiles,
  buildPriorityQueue,
  groupBySection,
  filterByTile,
  buildHealthDistribution,
  type SummaryTileKey,
  type PriorityCard,
  type PrioritySection,
} from "@/domain/rules";
import { getDemoToday, formatHuman } from "@/domain/dates";
import Link from "next/link";

const SECTION_META: Record<PrioritySection, { title: string; description: string }> = {
  escalate_now: { title: "Escalate now", description: "Mandatory-escalation conditions are met." },
  contact_today: { title: "Contact today", description: "Silence risk or a due checkpoint." },
  confirm_fix_held: { title: "Confirm the fix held", description: "Follow-up confirmation windows are due." },
  next_three_days: { title: "Next three days", description: "Upcoming scheduled work." },
};

export default function HomePage() {
  const { seed } = useStoreData();
  const storageMode = useStorageMode();
  const malformedCount = useMalformedRecordCount();
  const [activeFilter, setActiveFilter] = useState<SummaryTileKey | null>(null);
  const [activeCard, setActiveCard] = useState<PriorityCard | null>(null);
  const today = getDemoToday();

  const contexts = useMemo(() => buildAllPlacementContexts(seed), [seed]);
  const tiles = useMemo(() => buildSummaryTiles(contexts, today), [contexts, today]);
  const filteredContexts = useMemo(
    () => (activeFilter ? filterByTile(contexts, activeFilter, today) : contexts),
    [contexts, activeFilter, today],
  );
  const cards = useMemo(() => buildPriorityQueue(filteredContexts, today), [filteredContexts, today]);
  const grouped = useMemo(() => groupBySection(cards), [cards]);
  const healthDistribution = useMemo(() => buildHealthDistribution(contexts, today), [contexts, today]);

  const hasAnyWork = cards.length > 0;

  if (contexts.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Home" />
      <main className="flex-1 space-y-6 p-4 pb-8">
        {storageMode === "temporary" && <StorageFailureBanner />}
        {malformedCount > 0 && <MalformedRecordBanner count={malformedCount} />}

        <div>
          <p className="text-sm text-text-muted">{formatHuman(today)}</p>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Who do I contact today?</h2>
        </div>

        <SummaryTiles
          tiles={tiles}
          activeFilter={activeFilter}
          onToggleFilter={(key) => setActiveFilter((cur) => (cur === key ? null : key))}
        />

        <Link href="/placements/new">
          <Button variant="primary" fullWidth>
            + Add Placement
          </Button>
        </Link>

        {!hasAnyWork ? (
          <AllCaughtUpState />
        ) : (
          (Object.keys(SECTION_META) as PrioritySection[]).map((section) => {
            const sectionCards = grouped[section];
            if (sectionCards.length === 0) return null;
            return (
              <section key={section} className="space-y-2">
                <div>
                  <h3 className="text-sm font-semibold tracking-[-0.01em]">
                    {SECTION_META[section].title} <span className="text-text-muted font-normal">({sectionCards.length})</span>
                  </h3>
                  <p className="text-xs text-text-muted">{SECTION_META[section].description}</p>
                </div>
                <div className="space-y-3">
                  {sectionCards.map((card) => (
                    <PriorityCardView key={card.id} card={card} onPrimaryAction={setActiveCard} />
                  ))}
                </div>
              </section>
            );
          })
        )}

        <PlacementHealthCard distribution={healthDistribution} />

        <InsightsSection contexts={contexts} today={today} />
      </main>

      <ActionSheet card={activeCard} onClose={() => setActiveCard(null)} />
    </div>
  );
}
