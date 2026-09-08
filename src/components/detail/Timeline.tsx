import type { TimelineEvent } from "@/domain/rules";
import { formatHuman } from "@/domain/dates";

const TONE_DOT: Record<TimelineEvent["tone"], string> = {
  neutral: "#86868b",
  positive: "#16a34a",
  warning: "#ca8a04",
  critical: "#dc2626",
};

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-text-muted">No timeline events yet.</p>;
  }

  return (
    <ol className="space-y-0">
      {events.map((event, i) => (
        <li key={event.id} className="relative flex gap-3 pb-4">
          {i < events.length - 1 && (
            <span className="absolute left-[5px] top-4 bottom-0 w-px bg-border" aria-hidden />
          )}
          <span
            className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: TONE_DOT[event.tone] }}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium truncate">{event.title}</p>
              <span className="text-xs text-text-muted shrink-0">{formatHuman(event.at.slice(0, 10))}</span>
            </div>
            {event.detail && <p className="text-xs text-text-muted mt-0.5">{event.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
