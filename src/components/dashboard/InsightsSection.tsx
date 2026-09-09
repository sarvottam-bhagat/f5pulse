import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { PlacementContext } from "@/domain/rules";
import { buildIssuePipeline, buildTrialRadar } from "@/domain/rules/insights";

const PIPELINE_SEGMENTS = [
  { key: "Reported", color: "#ff4245" },
  { key: "Investigating", color: "#ff791b" },
  { key: "Fix in progress", color: "#ffd200" },
  { key: "Monitoring", color: "#0071e3" },
] as const;

export function InsightsSection({ contexts, today }: { contexts: PlacementContext[]; today: string }) {
  const trials = buildTrialRadar(contexts, today).slice(0, 4);
  const pipeline = buildIssuePipeline(contexts);
  const openIssueTotal = PIPELINE_SEGMENTS.reduce((total, segment) => total + pipeline[segment.key], 0);

  return (
    <>
      <Card className="flex min-h-64 flex-col p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.025em]">Trial radar</h3>
            <p className="mt-1 text-xs text-text-muted">Placements closest to trial end</p>
          </div>
          <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold tabular-nums text-text-secondary">
            {trials.length}
          </span>
        </div>

        {trials.length === 0 ? (
          <p className="my-auto text-sm text-text-muted">No active trials.</p>
        ) : (
          <div className="space-y-1">
            {trials.map((trial) => (
              <Link
                key={trial.placementId}
                href={`/placements/${trial.placementId}`}
                className="flex min-h-11 items-center gap-3 rounded-xl px-2 transition-colors hover:bg-background"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0071e3] text-[11px] font-semibold text-white">
                  {trial.daysRemaining}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{trial.clientName}</span>
                  <span className="block truncate text-xs text-text-muted">{trial.professionalName}</span>
                </span>
                <span className="text-xs font-medium text-text-secondary">{trial.daysRemaining}d</span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex min-h-64 flex-col p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold tracking-[-0.025em]">Issue pipeline</h3>
            <p className="mt-1 text-xs text-text-muted">Open work by resolution stage</p>
          </div>
          <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold tabular-nums text-text-secondary">
            {openIssueTotal}
          </span>
        </div>

        <div className="mb-6 flex h-2 overflow-hidden rounded-full bg-background">
          {PIPELINE_SEGMENTS.map((segment) => {
            const count = pipeline[segment.key];
            if (count === 0 || openIssueTotal === 0) return null;
            return (
              <span
                key={segment.key}
                style={{ width: `${(count / openIssueTotal) * 100}%`, backgroundColor: segment.color }}
                title={`${segment.key}: ${count}`}
              />
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          {PIPELINE_SEGMENTS.map((segment) => (
            <div key={segment.key} className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">{segment.key}</span>
              <span className="text-sm font-semibold tabular-nums">{pipeline[segment.key]}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
