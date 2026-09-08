"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { NoSearchResultsState } from "@/components/ui/EmptyState";
import type { Seed } from "@/domain/types";
import type { ChatContextAttachment } from "@/domain/chat";
import { resolveContextFromClient, resolveContextFromProfessional, resolveContextFromPlacement } from "@/domain/chat";

export function ContextPicker({
  open,
  seed,
  onClose,
  onAttach,
}: {
  open: boolean;
  seed: Seed;
  onClose: () => void;
  onAttach: (context: ChatContextAttachment) => void;
}) {
  const [tab, setTab] = useState<"client" | "professional" | "placement">("placement");
  const [pendingClientChoice, setPendingClientChoice] = useState<{ clientId: string; placementIds: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const activePlacementsAll = seed.placements.filter((p) => p.status === "Active" && !p.archived);
  const activeClientsAll = seed.clients.filter((c) => !c.archived);
  const activeProfessionalsAll = seed.professionals.filter(
    (p) => !p.archived && activePlacementsAll.some((pl) => pl.professionalId === p.id),
  );

  const q = query.trim().toLowerCase();
  const activePlacements = activePlacementsAll.filter((p) => {
    if (!q) return true;
    const client = seed.clients.find((c) => c.id === p.clientId);
    const pro = seed.professionals.find((x) => x.id === p.professionalId);
    return client?.companyName.toLowerCase().includes(q) || pro?.fullName.toLowerCase().includes(q);
  });
  const activeClients = activeClientsAll.filter((c) => !q || c.companyName.toLowerCase().includes(q));
  const activeProfessionals = activeProfessionalsAll.filter((p) => !q || p.fullName.toLowerCase().includes(q));

  const currentTabHasNoResults =
    !!q &&
    ((tab === "placement" && activePlacements.length === 0) ||
      (tab === "client" && activeClients.length === 0) ||
      (tab === "professional" && activeProfessionals.length === 0));

  function handlePickClient(clientId: string) {
    setError(null);
    const result = resolveContextFromClient(seed, clientId);
    if (result.needsPlacementChoice) {
      setPendingClientChoice(result.needsPlacementChoice);
      return;
    }
    if (result.error || !result.context) {
      setError(result.error ?? "Could not attach this client.");
      return;
    }
    onAttach(result.context);
  }

  function handlePickProfessional(professionalId: string) {
    setError(null);
    const result = resolveContextFromProfessional(seed, professionalId);
    if (result.error || !result.context) {
      setError(result.error ?? "Could not attach this professional.");
      return;
    }
    onAttach(result.context);
  }

  function handlePickPlacement(placementId: string) {
    setError(null);
    const result = resolveContextFromPlacement(seed, placementId);
    if (result.error || !result.context) {
      setError(result.error ?? "Could not attach this placement.");
      return;
    }
    onAttach(result.context);
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Attach context">
      {pendingClientChoice ? (
        <div className="space-y-2">
          <p className="text-sm text-text-muted">This client has multiple active placements. Choose one:</p>
          {pendingClientChoice.placementIds.map((pid) => {
            const p = seed.placements.find((pl) => pl.id === pid);
            const pro = p ? seed.professionals.find((x) => x.id === p.professionalId) : null;
            return (
              <button
                key={pid}
                onClick={() => handlePickPlacement(pid)}
                className="tap-target w-full rounded-2xl bg-surface-secondary px-3.5 text-left text-sm"
              >
                {pro?.fullName ?? "Unknown"} — {p?.roleTitle}
              </button>
            );
          })}
          <button onClick={() => setPendingClientChoice(null)} className="text-xs text-accent">
            ← Back
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by company or name…"
            className="tap-target w-full rounded-2xl bg-surface-secondary px-3.5 text-sm outline-none focus:ring-2 focus:ring-accent"
          />

          <div className="flex gap-2">
            {(["placement", "client", "professional"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`tap-target flex-1 rounded-full text-xs font-medium capitalize ${tab === t ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {currentTabHasNoResults && <NoSearchResultsState query={query} />}

          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {tab === "placement" &&
              activePlacements.map((p) => {
                const client = seed.clients.find((c) => c.id === p.clientId);
                const pro = seed.professionals.find((x) => x.id === p.professionalId);
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePickPlacement(p.id)}
                    className="tap-target w-full rounded-2xl bg-surface-secondary px-3.5 text-left text-sm"
                  >
                    <span className="font-medium">{client?.companyName}</span>
                    <span className="text-text-muted"> · {pro?.fullName}</span>
                  </button>
                );
              })}

            {tab === "client" &&
              activeClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handlePickClient(c.id)}
                  className="tap-target w-full rounded-2xl bg-surface-secondary px-3.5 text-left text-sm"
                >
                  {c.companyName}
                </button>
              ))}

            {tab === "professional" &&
              activeProfessionals.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePickProfessional(p.id)}
                  className="tap-target w-full rounded-2xl bg-surface-secondary px-3.5 text-left text-sm"
                >
                  {p.fullName} <span className="text-text-muted">· {p.role}</span>
                </button>
              ))}
          </div>

          {error && <p className="text-sm text-risk-critical">{error}</p>}
        </div>
      )}
    </BottomSheet>
  );
}
