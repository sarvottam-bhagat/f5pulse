import type { RiskLevel } from "@/domain/rules";

const DOT_COLOR: Record<RiskLevel, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#16a34a",
};

const LABELS: Record<RiskLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: DOT_COLOR[level] }} />
      {LABELS[level]}
    </span>
  );
}
