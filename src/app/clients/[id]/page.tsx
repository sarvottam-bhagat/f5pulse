"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { DetailActionSheet, type DetailAction } from "@/components/detail/DetailActionSheet";
import { ClientPlacementsSection, HealthBadge } from "@/components/client/ClientPlacementsSection";
import { DraftCommunicationCard } from "@/components/shared/DraftCommunicationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildClientView } from "@/domain/rules";
import { formatHuman, getDemoToday } from "@/domain/dates";
import { useStoreData } from "@/store/useStore";

function StatCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-[1.5rem] bg-surface-secondary px-4 py-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-[11px] text-text-muted">{note}</p>
    </div>
  );
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { seed } = useStoreData();
  const [action, setAction] = useState<DetailAction | null>(null);
  const today = getDemoToday();
  const view = useMemo(() => buildClientView(seed, id, today), [seed, id, today]);

  if (!view) {
    return (
      <main className="w-full py-12">
        <EmptyState icon="🔍" title="Client not found" description="This client may have been archived or does not exist." />
      </main>
    );
  }

  const { client } = view;
  const attentionAssignments = view.assignments.filter(
    (assignment) => assignment.health.state !== "Healthy" || assignment.feedbackDueCount > 0 || assignment.openIssues.length > 0,
  );
  const pendingDrafts = view.communicationHistory.filter((communication) => communication.draftBody && !communication.markedSentAt);

  return (
    <main className="w-full pb-12">
      <Link href="/clients" className="tap-target inline-flex items-center text-sm font-medium text-accent">← Back to clients</Link>

      <section className="mt-3 rounded-[2rem] bg-surface-secondary p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">Client overview</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{client.companyName}</h1>
            <p className="mt-1 text-sm text-text-muted">{client.industry}</p>
          </div>
          <div className="sm:text-right">
            <p className="mb-2 text-xs text-text-muted">Overall health</p>
            <HealthBadge state={view.overallHealth} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 border-t border-border pt-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-text-muted">Primary contact</p>
            <p className="mt-1 font-semibold">{client.primaryContactName}</p>
            <p className="text-xs text-text-muted">{client.contactTitle}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Contact details</p>
            <p className="mt-1 truncate font-medium">{client.email}</p>
            <p className="text-xs text-text-muted">{client.phone}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Timezone and channel</p>
            <p className="mt-1 font-medium">{client.usTimeZone.replace("America/", "").replaceAll("_", " ")}</p>
            <p className="text-xs capitalize text-text-muted">Prefers {client.preferredChannel}</p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Last client contact</p>
            <p className="mt-1 font-medium">
              {view.lastClientContact ? formatHuman(view.lastClientContact.createdAt.slice(0, 10)) : "No contact recorded"}
            </p>
            {view.lastClientContact && <p className="text-xs capitalize text-text-muted">{view.lastClientContact.channel} · {view.lastClientContact.summary}</p>}
          </div>
        </div>
      </section>

      <section aria-label="Client statistics" className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Active professionals" value={view.stats.activeProfessionals} note="Currently assigned" />
        <StatCard label="In trial" value={view.stats.inTrial} note="Needs closer attention" />
        <StatCard label="Feedback due" value={view.stats.feedbackDue} note="Client responses needed" />
        <StatCard label="Open issues" value={view.stats.openIssues} note="Across all placements" />
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em]">What needs attention</h2>
            <p className="mt-1 text-sm text-text-muted">The current signals that may need action.</p>
          </div>
          <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold">{attentionAssignments.length}</span>
        </div>

        {attentionAssignments.length === 0 ? (
          <div className="mt-3 rounded-[1.75rem] bg-risk-low-bg px-5 py-5">
            <p className="font-semibold text-risk-low">Everything looks healthy</p>
            <p className="mt-1 text-sm text-text-muted">No overdue feedback, serious issues, or escalation signals.</p>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {attentionAssignments.map((assignment) => (
              <article key={assignment.placement.id} className="rounded-[1.75rem] bg-surface-secondary p-4 sm:p-5">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{assignment.professional.fullName}</h3>
                      <HealthBadge state={assignment.health.state} />
                    </div>
                    <p className="mt-1 text-sm text-text-muted">{assignment.placement.roleTitle}</p>
                    <p className="mt-3 text-sm leading-6">{assignment.health.reasons[0]}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                      {assignment.feedbackDueCount > 0 && <span>{assignment.feedbackDueCount} feedback checkpoint due</span>}
                      {assignment.openIssues.length > 0 && <span>{assignment.openIssues.length} open issue{assignment.openIssues.length === 1 ? "" : "s"}</span>}
                    </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {pendingDrafts.length > 0 && (
        <section className="mt-7">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">Pending drafts</h2>
          <div className="mt-3 space-y-2">{pendingDrafts.map((communication) => <DraftCommunicationCard key={communication.id} communication={communication} />)}</div>
        </section>
      )}

      <ClientPlacementsSection assignments={view.assignments} onAction={setAction} />

      <details className="mt-8 rounded-[1.75rem] bg-surface-secondary p-5">
        <summary className="cursor-pointer list-none font-semibold">
          <span className="flex items-center justify-between gap-3">
            <span>History and records</span>
            <span className="text-xs font-normal text-text-muted">{view.feedbackHistory.length} feedback · {view.communicationHistory.length} communications</span>
          </span>
        </summary>
        <div className="mt-5 grid gap-6 border-t border-border pt-5 md:grid-cols-2">
          <section>
            <h3 className="text-sm font-semibold">Recent client feedback</h3>
            <div className="mt-2 space-y-2">
              {view.feedbackHistory.slice(0, 5).map((feedback) => (
                <div key={feedback.id} className="rounded-2xl bg-white p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{formatHuman(feedback.scheduledFor)}</span>
                    <span className="text-xs capitalize text-text-muted">{feedback.sentiment ?? "Pending"}</span>
                  </div>
                  {feedback.summary && <p className="mt-1 text-xs text-text-muted">{feedback.summary}</p>}
                </div>
              ))}
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold">Recent communication</h3>
            <div className="mt-2 space-y-2">
              {view.communicationHistory.slice(0, 5).map((communication) => (
                <div key={communication.id} className="rounded-2xl bg-white p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium capitalize">{communication.channel}</span>
                    <span className="text-xs text-text-muted">{formatHuman(communication.createdAt.slice(0, 10))}</span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">{communication.summary}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </details>

      <DetailActionSheet action={action} onClose={() => setAction(null)} />
    </main>
  );
}
