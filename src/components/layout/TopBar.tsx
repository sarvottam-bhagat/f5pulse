"use client";

import { useState } from "react";
import { useStore, useStorageMode } from "@/store/useStore";

export function TopBar({ title }: { title: string }) {
  const store = useStore();
  const mode = useStorageMode();
  const [confirmingReset, setConfirmingReset] = useState(false);

  function handleReset() {
    store.resetDemoData();
    setConfirmingReset(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-navbar)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">F5 Pulse</p>
          <h1 className="text-lg font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {mode === "temporary" && (
            <span className="rounded-full bg-risk-medium-bg px-2.5 py-1 text-[11px] font-medium text-risk-medium">
              Temporary mode
            </span>
          )}
          {confirmingReset ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleReset}
                className="tap-target rounded-full bg-risk-critical px-3 text-xs font-medium text-white active:scale-[0.98]"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="tap-target rounded-full bg-surface-secondary px-3 text-xs font-medium active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingReset(true)}
              className="tap-target rounded-full bg-surface-secondary px-3 text-xs font-medium text-text-secondary hover:brightness-95 active:scale-[0.98]"
            >
              Reset Demo Data
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
