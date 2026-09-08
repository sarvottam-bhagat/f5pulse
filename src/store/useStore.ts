"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getStore, Store } from "./Store";
import type { Seed } from "../domain/types";

/**
 * Subscribes a component to the store and returns the current seed data.
 * Re-renders whenever any mutation is applied. Uses useSyncExternalStore
 * so this is safe under concurrent rendering and SSR (server snapshot
 * falls back to the same seed loader, avoiding hydration mismatches since
 * the seed JSON is static).
 */
export function useStoreData(): { seed: Seed; store: Store } {
  const store = getStore();
  const seed = useSyncExternalStore(
    (onChange) => store.subscribe(onChange),
    () => store.getSeed(),
    () => store.getSeed(),
  );
  return { seed, store };
}

export function useStore(): Store {
  return getStore();
}

/**
 * Reports whether the store is running in temporary (non-persistent) mode.
 * Always starts as "persistent" so the server-rendered markup and the
 * client's first render match (the server has no localStorage and would
 * otherwise always compute "temporary"); the real mode is applied after
 * mount, once we know the client's actual storage availability.
 */
export function useStorageMode(): "persistent" | "temporary" {
  const store = getStore();
  const [mode, setMode] = useState<"persistent" | "temporary">("persistent");
  useEffect(() => {
    setMode(store.mode);
    return store.subscribe(() => setMode(store.mode));
  }, [store]);
  return mode;
}

/** Number of seed records dropped for failing referential-integrity validation. */
export function useMalformedRecordCount(): number {
  const store = getStore();
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(store.malformedRecordCount);
  }, [store]);
  return count;
}
