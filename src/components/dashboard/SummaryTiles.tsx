"use client";

import type { SummaryTile, SummaryTileKey } from "@/domain/rules";

const TILE_ICONS: Record<SummaryTileKey, string> = {
  contacts_due_today: "📞",
  escalations: "🚨",
  trial_placements: "🧪",
  silent_clients: "🤫",
  overdue_checkins: "⏰",
  fixes_awaiting_confirmation: "🔍",
};

export function SummaryTiles({
  tiles,
  activeFilter,
  onToggleFilter,
}: {
  tiles: SummaryTile[];
  activeFilter: SummaryTileKey | null;
  onToggleFilter: (key: SummaryTileKey) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map((tile) => {
        const active = activeFilter === tile.key;
        return (
          <button
            key={tile.key}
            onClick={() => onToggleFilter(tile.key)}
            className={`tap-target flex flex-col items-start gap-1 rounded-[20px] p-3.5 text-left transition-all active:scale-[0.98] ${
              active ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary text-foreground hover:brightness-95"
            }`}
            aria-pressed={active}
          >
            <div className="flex w-full items-center justify-between">
              <span className={`text-xs ${active ? "text-white/60" : "text-text-muted"}`}>{tile.label}</span>
              <span className="text-sm" aria-hidden>
                {TILE_ICONS[tile.key]}
              </span>
            </div>
            <span className="text-2xl font-semibold leading-none tracking-[-0.02em]">{tile.count}</span>
          </button>
        );
      })}
    </div>
  );
}
