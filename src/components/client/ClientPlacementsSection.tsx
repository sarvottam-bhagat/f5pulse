import Link from "next/link";
import type { DetailAction } from "@/components/detail/DetailActionSheet";
import type { ClientAssignmentSummary } from "@/domain/rules/clientView";
import type { HealthState } from "@/domain/types";
import { formatHuman } from "@/domain/dates";

const HEALTH_STYLE: Record<HealthState, string> = {
  Healthy: "bg-risk-low-bg text-risk-low",
  Watch: "bg-risk-medium-bg text-risk-medium",
  "At Risk": "bg-risk-high-bg text-risk-high",
  Critical: "bg-risk-critical-bg text-risk-critical",
};

export function HealthBadge({ state }: { state: HealthState }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${HEALTH_STYLE[state]}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {state}
    </span>
  );
}

export function ClientPlacementsSection({
  assignments,
  onAction,
}: {
  assignments: ClientAssignmentSummary[];
  onAction: (action: DetailAction) => void;
}) {
  return (
    <section className="mt-8">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.03em]">Professionals and placements</h2>
        <p className="mt-1 text-sm text-text-muted">Health and activity for each professional.</p>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {assignments.map((assignment) => (
          <article key={assignment.placement.id} className="rounded-[1.75rem] bg-surface-secondary p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-semibold">{assignment.professional.fullName}</h3>
                <p className="mt-0.5 text-sm text-text-muted">{assignment.placement.roleTitle}</p>
              </div>
              <HealthBadge state={assignment.health.state} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl bg-white px-3 py-3">
                <p className="text-text-muted">Placement</p>
                <p className="mt-1 font-medium">Started {formatHuman(assignment.placement.startDate)}</p>
                <p className="mt-0.5 text-text-muted">Trial ends {formatHuman(assignment.placement.trialEndDate)}</p>
              </div>
              <div className="rounded-2xl bg-white px-3 py-3">
                <p className="text-text-muted">Latest feedback</p>
                <p className="mt-1 font-medium capitalize">{assignment.latestClientFeedback?.sentiment ?? "Not collected"}</p>
                <p className="mt-0.5 text-text-muted">
                  {assignment.latestClientFeedback
                    ? formatHuman(assignment.latestClientFeedback.scheduledFor)
                    : assignment.nextClientFeedback
                      ? `Due ${formatHuman(assignment.nextClientFeedback.scheduledFor)}`
                      : "Nothing scheduled"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onAction({ kind: "record_feedback", placementId: assignment.placement.id, subjectType: "client" })} className="tap-target rounded-full bg-white px-4 text-xs font-medium">Record feedback</button>
              <button type="button" onClick={() => onAction({ kind: "log_contact", placementId: assignment.placement.id, subjectType: "client" })} className="tap-target rounded-full bg-white px-4 text-xs font-medium">Log contact</button>
              <Link href={`/placements/${assignment.placement.id}`} className="tap-target inline-flex items-center rounded-full px-4 text-xs font-medium text-accent">View placement</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
