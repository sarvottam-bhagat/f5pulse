"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { BackButton } from "@/components/detail/DetailHeader";
import { DetailActionSheet, type DetailAction } from "@/components/detail/DetailActionSheet";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStoreData } from "@/store/useStore";
import { buildProfessionalView } from "@/domain/rules";
import { formatHuman } from "@/domain/dates";

export default function ProfessionalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { seed } = useStoreData();
  const [action, setAction] = useState<DetailAction | null>(null);

  const view = useMemo(() => buildProfessionalView(seed, id), [seed, id]);

  if (!view) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="Professional not found" />
        <div className="p-4">
          <EmptyState icon="🔍" title="Professional not found" description="This professional may have been archived or does not exist." />
        </div>
      </div>
    );
  }

  const { professional, currentPlacement } = view;
  const currentClient = currentPlacement ? seed.clients.find((c) => c.id === currentPlacement.clientId) : null;

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Professional" />
      <main className="flex-1 space-y-4 p-4 pb-8">
        <BackButton />

        <div>
          <h1 className="text-xl font-semibold tracking-[-0.02em]">{professional.fullName}</h1>
          <p className="text-sm text-text-muted">{professional.role}</p>
        </div>

        <Card className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Country</span>
            <span className="font-medium">{professional.country}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Time zone</span>
            <span className="font-medium">{professional.timeZone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Working hours</span>
            <span className="font-medium">
              {professional.workingHours.start}–{professional.workingHours.end}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">F5 manager</span>
            <span className="font-medium">{professional.f5Manager}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Email</span>
            <span className="font-medium">{professional.email}</span>
          </div>
        </Card>

        {currentPlacement && (
          <Card className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Current placement</p>
              <p className="text-sm font-medium">{currentClient?.companyName ?? "Unknown client"}</p>
            </div>
            <Link href={`/placements/${currentPlacement.id}`}>
              <Button variant="ghost" className="text-xs">
                View →
              </Button>
            </Link>
          </Card>
        )}

        {currentPlacement && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Button variant="secondary" className="text-xs" onClick={() => setAction({ kind: "log_contact", placementId: currentPlacement.id, subjectType: "professional" })}>
              Log contact
            </Button>
            <Button
              variant="secondary"
              className="text-xs"
              onClick={() => setAction({ kind: "record_attendance", placementId: currentPlacement.id, professionalId: professional.id })}
            >
              Record attendance
            </Button>
            <Button variant="secondary" className="text-xs" onClick={() => setAction({ kind: "coaching_note", placementId: currentPlacement.id })}>
              Add coaching note
            </Button>
            <Button variant="secondary" className="text-xs" onClick={() => setAction({ kind: "improvement_plan", placementId: currentPlacement.id })}>
              Improvement plan
            </Button>
            <Button variant="secondary" className="text-xs" onClick={() => setAction({ kind: "draft_email", placementId: currentPlacement.id, subjectType: "professional" })}>
              Draft email
            </Button>
            <Button variant="danger" className="text-xs" onClick={() => setAction({ kind: "escalate", placementId: currentPlacement.id, subjectType: "professional" })}>
              Escalate
            </Button>
          </div>
        )}

        {view.historicalPlacements.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Historical placements ({view.historicalPlacements.length})</h3>
            {view.historicalPlacements.map((p) => {
              const client = seed.clients.find((c) => c.id === p.clientId);
              return (
                <Link key={p.id} href={`/placements/${p.id}`}>
                  <Card className="flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity">
                    <div>
                      <p className="text-sm font-medium">{client?.companyName ?? "Unknown"}</p>
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
          <h3 className="text-sm font-semibold">Attendance ({view.attendance.length})</h3>
          {view.attendance.length === 0 ? (
            <p className="text-sm text-text-muted">No attendance records.</p>
          ) : (
            view.attendance.slice(0, 10).map((a) => (
              <Card key={a.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium capitalize">{a.eventType.replace(/_/g, " ")}</p>
                  {a.notes && <p className="text-xs text-text-muted">{a.notes}</p>}
                </div>
                <span className="text-xs text-text-muted">{formatHuman(a.date)}</span>
              </Card>
            ))
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Open concerns ({view.openConcerns.length})</h3>
          {view.openConcerns.length === 0 ? (
            <p className="text-sm text-text-muted">No open concerns.</p>
          ) : (
            view.openConcerns.map((issue) => (
              <Card key={issue.id} className="text-sm">
                <p className="font-medium">{issue.title}</p>
                <p className="text-xs text-text-muted">{issue.status} · {issue.severity} severity</p>
              </Card>
            ))
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Performance feedback ({view.performanceFeedback.length})</h3>
          {view.performanceFeedback.slice(0, 8).map((f) => (
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
            </Card>
          ))}
        </section>
      </main>

      <DetailActionSheet action={action} onClose={() => setAction(null)} />
    </div>
  );
}
