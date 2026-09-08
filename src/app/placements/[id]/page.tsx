"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { BackButton } from "@/components/detail/DetailHeader";
import { Timeline } from "@/components/detail/Timeline";
import { LogOutcomeSheet } from "@/components/detail/LogOutcomeSheet";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HealthBadge } from "@/components/ui/HealthBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStoreData } from "@/store/useStore";
import { buildPlacementContext, assessHealth, buildPlacementTimeline } from "@/domain/rules";
import { formatHuman, getDemoToday } from "@/domain/dates";

export default function PlacementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { seed } = useStoreData();
  const [logOutcomeOpen, setLogOutcomeOpen] = useState(false);
  const today = getDemoToday();

  const ctx = useMemo(() => buildPlacementContext(seed, id), [seed, id]);
  const health = useMemo(() => (ctx ? assessHealth(ctx, today) : null), [ctx, today]);
  const timeline = useMemo(() => (ctx ? buildPlacementTimeline(ctx) : []), [ctx]);

  if (!ctx || !health) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="Placement not found" />
        <div className="p-4">
          <EmptyState icon="🔍" title="Placement not found" description="This placement may have been archived or does not exist." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Placement" />
      <main className="flex-1 space-y-4 p-4 pb-8">
        <BackButton />

        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.02em]">{ctx.placement.roleTitle}</h1>
            <p className="text-sm text-text-muted">
              <Link href={`/clients/${ctx.client.id}`} className="text-accent">
                {ctx.client.companyName}
              </Link>
              {" · "}
              <Link href={`/professionals/${ctx.professional.id}`} className="text-accent">
                {ctx.professional.fullName}
              </Link>
            </p>
          </div>
          <HealthBadge state={health.state} />
        </div>

        <Card className="space-y-2">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Why this state</p>
          <ul className="space-y-1 text-sm">
            {health.reasons.map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Status</span>
            <span className="font-medium">{ctx.placement.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Start date</span>
            <span className="font-medium">{formatHuman(ctx.placement.startDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Trial ends</span>
            <span className="font-medium">{formatHuman(ctx.placement.trialEndDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">F5 owner</span>
            <span className="font-medium">{ctx.placement.f5Owner}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Schedule</span>
            <span className="font-medium">{ctx.placement.expectedSchedule}</span>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button variant="primary" fullWidth onClick={() => setLogOutcomeOpen(true)}>
            Log Outcome
          </Button>
          <Link href={`/chat?placementId=${ctx.placement.id}`} className="flex-1">
            <Button variant="secondary" fullWidth>
              Investigate in Chat
            </Button>
          </Link>
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Timeline</h3>
          <Card>
            <Timeline events={timeline} />
          </Card>
        </section>
      </main>

      <LogOutcomeSheet open={logOutcomeOpen} placementId={ctx.placement.id} onClose={() => setLogOutcomeOpen(false)} />
    </div>
  );
}
