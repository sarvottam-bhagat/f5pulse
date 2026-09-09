"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { buildClientDirectoryRows, filterClientDirectoryRows } from "@/domain/rules";
import { useStoreData } from "@/store/useStore";

type StatusFilter = "all" | "active" | "archived";

function timeZoneLabel(timeZone: string) {
  return timeZone.replace("America/", "").replaceAll("_", " ");
}

function ViewClientLink({ id, name }: { id: string; name: string }) {
  return (
    <Link
      href={`/clients/${id}`}
      aria-label={`View ${name}`}
      title={`View ${name}`}
      className="tap-target inline-flex h-11 w-11 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-white hover:text-foreground"
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
        <path d="M2.8 12s3.3-5.2 9.2-5.2 9.2 5.2 9.2 5.2-3.3 5.2-9.2 5.2S2.8 12 2.8 12Z" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    </Link>
  );
}

export default function ClientsPage() {
  const { seed } = useStoreData();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const rows = useMemo(() => buildClientDirectoryRows(seed), [seed]);
  const visibleRows = useMemo(() => filterClientDirectoryRows(rows, query, status), [query, rows, status]);

  return (
    <main className="w-full pb-12">
      <header className="mb-7">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-text-muted">F5 relationships</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">Clients</h1>
        <p className="mt-1 text-base text-text-muted">Manage US client accounts and their active placements.</p>
      </header>

      <section aria-label="Client directory" className="rounded-[2rem] bg-surface-secondary p-3 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search clients</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" fill="none" aria-hidden="true">
              <circle cx="10.8" cy="10.8" r="6.4" stroke="currentColor" strokeWidth="1.8" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by company, contact, email, or timezone…"
              className="tap-target w-full rounded-full border border-border bg-white py-3 pl-12 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label>
            <span className="sr-only">Filter clients by status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              className="tap-target w-full rounded-2xl border border-border bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-accent/20 sm:w-44"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>

        <div className="mt-5 hidden overflow-hidden md:block">
          <table className="w-full table-fixed text-left">
            <thead>
              <tr className="border-b border-border text-xs font-medium text-text-muted">
                <th className="w-[27%] px-4 py-3">Client</th>
                <th className="w-[25%] px-4 py-3">Primary contact</th>
                <th className="w-[18%] px-4 py-3">US timezone</th>
                <th className="w-[14%] px-4 py-3">Placements</th>
                <th className="w-[11%] px-4 py-3">Status</th>
                <th className="w-[5%] px-1 py-3 text-center">View</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ client, activePlacementCount, totalPlacementCount }) => (
                <tr key={client.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-4 align-middle">
                    <p className="truncate text-sm font-semibold">{client.companyName}</p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">{client.industry}</p>
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <p className="truncate text-sm font-medium">{client.primaryContactName}</p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">{client.email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-text-secondary">{timeZoneLabel(client.usTimeZone)}</td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold">{activePlacementCount}</span>
                    <span className="text-xs text-text-muted"> active · {totalPlacementCount} total</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${client.archived ? "bg-white text-text-muted" : "bg-risk-low-bg text-risk-low"}`}>
                      {client.archived ? "Archived" : "Active"}
                    </span>
                  </td>
                  <td className="px-1 py-2 text-center"><ViewClientLink id={client.id} name={client.companyName} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 space-y-2 md:hidden">
          {visibleRows.map(({ client, activePlacementCount, totalPlacementCount }) => (
            <article key={client.id} className="rounded-[1.5rem] bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold">{client.companyName}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${client.archived ? "bg-surface-secondary text-text-muted" : "bg-risk-low-bg text-risk-low"}`}>
                      {client.archived ? "Archived" : "Active"}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-text-secondary">{client.primaryContactName}</p>
                  <p className="truncate text-xs text-text-muted">{client.email}</p>
                </div>
                <ViewClientLink id={client.id} name={client.companyName} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-2xl bg-surface-secondary px-3 py-2.5">
                  <p className="text-text-muted">US timezone</p>
                  <p className="mt-0.5 font-medium">{timeZoneLabel(client.usTimeZone)}</p>
                </div>
                <div className="rounded-2xl bg-surface-secondary px-3 py-2.5">
                  <p className="text-text-muted">Placements</p>
                  <p className="mt-0.5 font-medium">{activePlacementCount} active · {totalPlacementCount} total</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {visibleRows.length === 0 && (
          <div className="py-16 text-center">
            <p className="font-medium">No clients found</p>
            <p className="mt-1 text-sm text-text-muted">Try another search or status.</p>
          </div>
        )}
      </section>

      <p className="mt-4 text-sm text-text-muted">Showing {visibleRows.length} of {rows.length} clients</p>
    </main>
  );
}
