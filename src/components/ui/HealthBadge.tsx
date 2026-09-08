import type { HealthState } from "@/domain/types";

const DOT_COLOR: Record<HealthState, string> = {
  Critical: "#dc2626",
  "At Risk": "#ea580c",
  Watch: "#ca8a04",
  Healthy: "#16a34a",
};

export function HealthBadge({ state }: { state: HealthState }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: DOT_COLOR[state] }} />
      {state}
    </span>
  );
}
