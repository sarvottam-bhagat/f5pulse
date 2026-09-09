import type { HealthDistribution } from "@/domain/rules";
import { Card } from "@/components/ui/Card";

const SEGMENTS: { key: keyof HealthDistribution; label: string; color: string }[] = [
  { key: "Healthy", label: "Healthy", color: "#16a34a" },
  { key: "Watch", label: "Watch", color: "#ca8a04" },
  { key: "At Risk", label: "At Risk", color: "#ea580c" },
  { key: "Critical", label: "Critical", color: "#dc2626" },
];

export function PlacementHealthCard({ distribution }: { distribution: HealthDistribution }) {
  const total = SEGMENTS.reduce((sum, s) => sum + distribution[s.key], 0) || 1;

  return (
    <Card className="flex min-h-64 flex-col p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold tracking-[-0.025em]">Placement health</h3>
        <p className="mt-1 text-xs text-text-muted">Current state across active placements</p>
      </div>

      <div className="mb-7 flex h-2 overflow-hidden rounded-full bg-background gap-px">
        {SEGMENTS.map((seg) => {
          const count = distribution[seg.key];
          if (count === 0) return null;
          const pct = (count / total) * 100;
          return (
            <div
              key={seg.key}
              className="first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, backgroundColor: seg.color }}
              title={`${seg.label}: ${count}`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-5">
        {SEGMENTS.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tabular-nums">{distribution[seg.key]}</span>
              <span className="text-xs text-text-muted">{seg.label}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
