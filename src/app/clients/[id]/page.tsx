"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { BackButton } from "@/components/detail/DetailHeader";
import { DetailActionSheet, type DetailAction } from "@/components/detail/DetailActionSheet";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { DraftCommunicationCard } from "@/components/shared/DraftCommunicationCard";
import { useStoreData } from "@/store/useStore";
import { buildClientView } from "@/domain/rules";
import { formatHuman, getDemoToday } from "@/domain/dates";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { seed } = useStoreData();
  const [action, setAction] = useState<DetailAction | null>(null);
  const today = getDemoToday();

  const view = useMemo(() => buildClientView(seed, id, today), [seed, id, today]);
  const primaryPlacementId = view?.activePlacements[0]?.id ?? view?.historicalPlacements[0]?.id ?? null;

  if (!view) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="Client not found" />
        <div className="p-4">
          <EmptyState icon="🔍" title="Client not found" description="This client may have been archived or does not exist." />
        </div>
      </div>
    );
  }

  const { client } = view;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Client" />
      <main className="flex-1 space-y-4 p-4 pb-8">
        <BackButton />

        <div>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold tracking-[-0.02em]">{client.companyName}</h1>
            {view.isSilent && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-risk-high">
                <span className="h-2 w-2 rounded-full bg-risk-high" /> Silent
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">{client.industry}</p>
        </div>

        <Card className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Contact</span>
            <span className="font-medium">
              {client.primaryContactName} · {client.contactTitle}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Email</span>
            <span className="font-medium">{client.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Phone</span>
            <span className="font-medium">{client.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Time zone</span>
            <span className="font-medium">{client.usTimeZone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Preferred channel</span>
            <span className="font-medium capitalize">{client.preferredChannel}</span>
          </div>
        </Card>

        {primaryPlacementId && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Button variant="secondary" className="text-xs" onClick={() => setAction({ kind: "record_feedback", placementId: primaryPlacementId, subjectType: "client" })}>
              Record feedback
            </Button>
            <Button variant="secondary" className="text-xs" onClick={() => setAction({ kind: "log_contact", placementId: primaryPlacementId, subjectType: "client" })}>
              Log contact
            </Button>
            <Button variant="secondary" className="text-xs" onClick={() => setAction({ kind: "draft_email", placementId: primaryPlacementId, subjectType: "client" })}>
              Draft email
            </Button>
            <Button variant="secondary" className="text-xs" onClick={() => setAction({ kind: "schedule_checkin", placementId: primaryPlacementId, subjectType: "client" })}>
              Schedule check-in
            </Button>
            <Button variant="secondary" className="text-xs" onClick={() => setAction({ kind: "open_issue", placementId: primaryPlacementId, subjectType: "client" })}>
              Open issue
            </Button>
            <Button variant="danger" className="text-xs" onClick={() => setAction({ kind: "escalate", placementId: primaryPlacementId, subjectType: "client" })}>
              Escalate
            </Button>
          </div>
        )}

        {view.communicationHistory.some((c) => c.draftBody && !c.markedSentAt) && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Pending drafts</h3>
            {view.communicationHistory
              .filter((c) => c.draftBody && !c.markedSentAt)
              .map((c) => (
                <DraftCommunicationCard key={c.id} communication={c} />
              ))}
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Active placements ({view.activePlacements.length})</h3>
          {view.activePlacements.length === 0 ? (
            <p className="text-sm text-text-muted">No active placements.</p>
          ) : (
            view.activePlacements.map((p) => {
              const professional = seed.professionals.find((pr) => pr.id === p.professionalId);
              return (
                <Link key={p.id} href={`/placements/${p.id}`}>
                  <Card className="flex items-center justify-between hover:brightness-95 transition-all">
                    <div>
                      <p className="text-sm font-medium">{professional?.fullName ?? "Unknown"}</p>
                      <p className="text-xs text-text-muted">{p.roleTitle} · Started {formatHuman(p.startDate)}</p>
                    </div>
                    <span className="text-text-muted">→</span>
                  </Card>
                </Link>
              );
            })
          )}
        </section>

        {view.historicalPlacements.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Historical placements ({view.historicalPlacements.length})</h3>
            {view.historicalPlacements.map((p) => {
              const professional = seed.professionals.find((pr) => pr.id === p.professionalId);
              return (
                <Link key={p.id} href={`/placements/${p.id}`}>
                  <Card className="flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                    <div>
                      <p className="text-sm font-medium">{professional?.fullName ?? "Unknown"}</p>
                      <p className="text-xs text-text-muted">{p.endReason ?? "Ended"}</p>
                    </div>
                    <span className="text-text-muted">→</span>
                  </Card>
                </Link>
              );
            })}
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">
            Open issues ({view.openIssues.length})
          </h3>
          {view.openIssues.length === 0 ? (
            <p className="text-sm text-text-muted">No open issues.</p>
          ) : (
            view.openIssues.map((issue) => (
              <Card key={issue.id} className="text-sm">
                <p className="font-medium">{issue.title}</p>
                <p className="text-xs text-text-muted">{issue.status} · {issue.severity} severity</p>
              </Card>
            ))
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Feedback history ({view.feedbackHistory.length})</h3>
          {view.feedbackHistory.slice(0, 8).map((f) => (
            <Card key={f.id} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{formatHuman(f.scheduledFor)}</span>
                {f.sentiment && (
                  <span
                    className={`text-xs font-medium capitalize ${f.sentiment === "negative" ? "text-risk-critical" : f.sentiment === "positive" ? "text-risk-low" : "text-text-muted"}`}
                  >
                    {f.sentiment}
                  </span>
                )}
              </div>
              {f.summary && <p className="text-text-muted text-xs mt-1">{f.summary}</p>}
              {!f.collectedAt && <p className="text-xs text-risk-high mt-1">Not yet collected</p>}
            </Card>
          ))}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Communication history ({view.communicationHistory.length})</h3>
          {view.communicationHistory.slice(0, 8).map((c) => (
            <Card key={c.id} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize">{c.channel}</span>
                <span className="text-xs text-text-muted">{formatHuman(c.createdAt.slice(0, 10))}</span>
              </div>
              <p className="text-text-muted text-xs mt-1">{c.summary}</p>
            </Card>
          ))}
        </section>
      </main>

      <DetailActionSheet action={action} onClose={() => setAction(null)} />
    </div>
  );
}
