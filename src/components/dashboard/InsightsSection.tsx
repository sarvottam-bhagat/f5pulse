"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import type { PlacementContext } from "@/domain/rules";
import {
  buildTrialRadar,
  buildFeedbackTrends,
  buildAttendanceSignals,
  buildIssuePipeline,
  buildRecurringProblems,
  buildUpcomingMonthlyCheckins,
  buildFollowUpCalendar,
} from "@/domain/rules/insights";
import { formatHuman } from "@/domain/dates";

const PIPELINE_COLORS: Record<string, string> = {
  Reported: "#dc2626",
  Investigating: "#ea580c",
  "Fix in progress": "#ca8a04",
  Monitoring: "#0071e3",
  Closed: "#16a34a",
};

function RankedRow({
  href,
  rank,
  primary,
  secondary,
  trailing,
}: {
  href: string;
  rank: number;
  primary: string;
  secondary?: string;
  trailing?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-2 -mx-1 px-1 rounded-xl hover:bg-background transition-colors"
    >
      <span className="text-xs font-bold text-text-muted tabular-nums w-4 text-center shrink-0">{rank}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{primary}</p>
        {secondary && <p className="text-xs text-text-muted truncate">{secondary}</p>}
      </div>
      {trailing && <span className="text-xs font-medium text-text-secondary shrink-0">{trailing}</span>}
    </Link>
  );
}

export function InsightsSection({ contexts, today }: { contexts: PlacementContext[]; today: string }) {
  const trialRadar = buildTrialRadar(contexts, today).slice(0, 5);
  const feedbackTrends = buildFeedbackTrends(contexts, today).filter((t) => t.silenceLevel !== "none").slice(0, 5);
  const attendanceSignals = buildAttendanceSignals(contexts).slice(0, 5);
  const pipeline = buildIssuePipeline(contexts);
  const recurring = buildRecurringProblems(contexts).slice(0, 5);
  const upcomingCheckins = buildUpcomingMonthlyCheckins(contexts, today).slice(0, 5);
  const followupCalendar = buildFollowUpCalendar(contexts, today).slice(0, 5);

  const pipelineTotal = Object.values(pipeline).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-[-0.01em]">Additional insights</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Trial-period radar</h4>
          {trialRadar.length === 0 ? (
            <p className="text-sm text-text-muted py-2">No placements currently in trial.</p>
          ) : (
            trialRadar.map((t, i) => (
              <RankedRow
                key={t.placementId}
                href={`/placements/${t.placementId}`}
                rank={i + 1}
                primary={t.clientName}
                secondary={t.professionalName}
                trailing={`${t.daysRemaining}d left`}
              />
            ))
          )}
        </Card>

        <Card>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Feedback &amp; silence trends</h4>
          {feedbackTrends.length === 0 ? (
            <p className="text-sm text-text-muted py-2">No silence risk detected.</p>
          ) : (
            feedbackTrends.map((t, i) => (
              <RankedRow
                key={t.placementId}
                href={`/placements/${t.placementId}`}
                rank={i + 1}
                primary={t.clientName}
                secondary={
                  t.negativeCount > 0
                    ? `${t.negativeCount} negative feedback record${t.negativeCount === 1 ? "" : "s"}`
                    : "Overdue feedback checkpoint"
                }
                trailing={t.silenceLevel === "at_risk" ? "At risk" : "Watch"}
              />
            ))
          )}
        </Card>

        <Card>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Attendance &amp; performance</h4>
          {attendanceSignals.length === 0 ? (
            <p className="text-sm text-text-muted py-2">No attendance concerns on record.</p>
          ) : (
            attendanceSignals.map((s, i) => (
              <RankedRow
                key={s.placementId}
                href={`/placements/${s.placementId}`}
                rank={i + 1}
                primary={s.professionalName}
                secondary={s.clientName}
                trailing={`${s.lateCount} late · ${s.absentCount} absent`}
              />
            ))
          )}
        </Card>

        <Card>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Issue pipeline</h4>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-background gap-px mb-4">
            {Object.entries(pipeline).map(([status, count]) => {
              if (count === 0) return null;
              const pct = (count / pipelineTotal) * 100;
              return (
                <div
                  key={status}
                  className="first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${pct}%`, backgroundColor: PIPELINE_COLORS[status] }}
                  title={`${status}: ${count}`}
                />
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(pipeline).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: PIPELINE_COLORS[status] }} />
                <span className="text-xs text-text-secondary truncate">{status}</span>
                <span className="text-xs font-semibold ml-auto">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Recurring problems</h4>
          {recurring.length === 0 ? (
            <p className="text-sm text-text-muted py-2">No recurring or reopened issues.</p>
          ) : (
            recurring.map((r, i) => (
              <RankedRow
                key={`${r.placementId}-${i}`}
                href={`/placements/${r.placementId}`}
                rank={i + 1}
                primary={r.issueTitle}
                secondary={r.clientName}
                trailing={r.recurrenceCount > 0 ? `Recurred ×${r.recurrenceCount}` : `Reopened ×${r.reopenedCount}`}
              />
            ))
          )}
        </Card>

        <Card>
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Upcoming monthly check-ins</h4>
          {upcomingCheckins.length === 0 ? (
            <p className="text-sm text-text-muted py-2">Nothing scheduled in the next two weeks.</p>
          ) : (
            upcomingCheckins.map((c, i) => (
              <RankedRow
                key={`${c.placementId}-${c.subjectType}-${c.dueDate}`}
                href={`/placements/${c.placementId}`}
                rank={i + 1}
                primary={c.clientName}
                secondary={`${c.subjectType === "client" ? "Client" : "Professional"} check-in`}
                trailing={formatHuman(c.dueDate)}
              />
            ))
          )}
        </Card>

        <Card className="sm:col-span-2">
          <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Follow-up calendar</h4>
          {followupCalendar.length === 0 ? (
            <p className="text-sm text-text-muted py-2">No follow-ups scheduled in the next two weeks.</p>
          ) : (
            followupCalendar.map((f, i) => (
              <RankedRow
                key={`${f.placementId}-${i}`}
                href={`/placements/${f.placementId}`}
                rank={i + 1}
                primary={f.description}
                secondary={`${f.clientName} · ${f.owner}${f.completed ? " · Done" : ""}`}
                trailing={formatHuman(f.dueDate)}
              />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
