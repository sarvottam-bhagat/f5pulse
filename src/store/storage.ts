// Thin wrapper around localStorage with a schema version so future shape
// changes can invalidate stale persisted data instead of crashing on load.

const STORAGE_KEY = "f5pulse:store:v1";
const STORAGE_VERSION = 1;

interface Envelope<T> {
  version: number;
  data: T;
}

export type StorageStatus = "ok" | "unavailable" | "corrupt";

function isStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__f5pulse_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function readPersisted<T>(): { status: StorageStatus; data: T | null } {
  if (!isStorageAvailable()) return { status: "unavailable", data: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { status: "ok", data: null };
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (parsed.version !== STORAGE_VERSION) {
      return { status: "ok", data: null };
    }
    return { status: "ok", data: parsed.data };
  } catch {
    return { status: "corrupt", data: null };
  }
}

export function writePersisted<T>(data: T): StorageStatus {
  if (!isStorageAvailable()) return "unavailable";
  try {
    const envelope: Envelope<T> = { version: STORAGE_VERSION, data };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    return "ok";
  } catch {
    return "unavailable";
  }
}

export function clearPersisted(): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
