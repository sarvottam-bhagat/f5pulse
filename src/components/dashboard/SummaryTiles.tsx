"use client";

import type { SummaryTile, SummaryTileKey } from "@/domain/rules";

const TILE_COLORS: Record<SummaryTileKey, string> = {
  contacts_due_today: "bg-[#0071e3]",
  escalations: "bg-[#ff4245]",
  trial_placements: "bg-[#8b5cf6]",
  silent_clients: "bg-[#ff9f0a]",
  overdue_checkins: "bg-[#ff791b]",
  fixes_awaiting_confirmation: "bg-[#04b862]",
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
  const primary = tiles.slice(0, 3);
  const supporting = tiles.slice(3);

  function tileButton(tile: SummaryTile, compact = false) {
    const active = activeFilter === tile.key;
    return (
      <button
        key={tile.key}
        onClick={() => onToggleFilter(tile.key)}
        className={`tap-target text-left transition-all duration-200 active:scale-[0.985] ${
          compact
            ? "flex min-w-0 items-start gap-2 px-3 py-3 sm:items-center sm:gap-3 sm:px-6 sm:py-4"
            : "flex min-h-28 flex-col justify-between rounded-[24px] p-3 sm:min-h-36 sm:rounded-[28px] sm:p-6"
        } ${active ? "bg-[#1d1d1f] text-white" : compact ? "hover:bg-black/[0.025]" : "bg-surface-secondary hover:brightness-[0.985]"}`}
        aria-pressed={active}
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${compact ? "mt-1" : ""} ${TILE_COLORS[tile.key]}`} aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className={`block font-medium ${compact ? "line-clamp-2 text-[10px] leading-tight sm:text-xs" : "text-xs leading-tight sm:text-sm"} ${active ? "text-white/70" : "text-text-secondary"}`}>
            {tile.label}
          </span>
          <span className={`${compact ? "mt-1 block text-base sm:text-lg" : "mt-5 block text-2xl sm:mt-7 sm:text-3xl"} font-semibold leading-none tracking-[-0.035em] tabular-nums`}>
            {tile.count}
          </span>
        </span>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div aria-label="Primary metrics" className="grid grid-cols-3 gap-2 sm:gap-4">
        {primary.map((tile) => tileButton(tile))}
      </div>
      <div
        aria-label="Status signals"
        className="grid grid-cols-3 divide-x divide-border/70 overflow-hidden rounded-[24px] bg-surface-secondary sm:rounded-[28px]"
      >
        {supporting.map((tile) => tileButton(tile, true))}
      </div>
    </div>
  );
}
