// The application store: the single source of truth the UI reads from.
// Wraps the pure mutation functions in mutations.ts, persists every
// mutation to localStorage, and notifies subscribers so React components
// can re-render after any change (dashboard insights recalculate because
// they are derived fresh from seed state on every read, not cached).

import type { Seed } from "../domain/types";
import { loadOriginalSeed } from "./seedData";
import { validateAndCleanSeed } from "./validateSeed";
import { readPersisted, writePersisted, clearPersisted, type StorageStatus } from "./storage";
import * as mutations from "./mutations";
import type {
  StoreResult,
  CreatePlacementBundleInput,
  CreatePlacementBundleResult,
  LogCommunicationInput,
  LogOutcomeInput,
  RecordFeedbackInput,
  RecordAttendanceInput,
  CreateIssueInput,
  ImplementFixInput,
  ConfirmFollowupWindowInput,
  CompleteFollowupInput,
  CreateEscalationInput,
} from "./types";
import type { Client, Professional, Issue, EscalationStatus } from "../domain/types";

export type StoreMode = "persistent" | "temporary";

type Listener = () => void;

export class Store {
  private seed: Seed;
  private listeners: Set<Listener> = new Set();
  public mode: StoreMode = "persistent";
  public lastStorageStatus: StorageStatus = "ok";
  public malformedRecordCount = 0;

  constructor() {
    const { status, data } = readPersisted<Seed>();
    this.lastStorageStatus = status;
    if (status === "unavailable") {
      this.mode = "temporary";
    }
    if (data) {
      this.seed = data;
    } else {
      const { seed, skippedCount } = validateAndCleanSeed(loadOriginalSeed());
      this.seed = seed;
      this.malformedRecordCount = skippedCount;
    }
    if (!data && status === "ok") {
      this.persist();
    }
  }

  getSeed(): Seed {
    return this.seed;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const l of this.listeners) l();
  }

  private persist() {
    if (this.mode === "temporary") return;
    const status = writePersisted(this.seed);
    this.lastStorageStatus = status;
    if (status === "unavailable") {
      this.mode = "temporary";
    }
  }

  private applySeed(next: Seed) {
    this.seed = next;
    this.persist();
    this.notify();
  }

  private now(): string {
    return new Date().toISOString();
  }

  resetDemoData(): void {
    this.seed = loadOriginalSeed();
    clearPersisted();
    this.persist();
    this.notify();
  }

  createPlacementBundle(input: CreatePlacementBundleInput): StoreResult<CreatePlacementBundleResult> {
    const result = mutations.createPlacementBundle(this.seed, input, this.now());
    if (!result.ok) return result;
    this.applySeed(result.value.seed);
    return { ok: true, value: result.value.result };
  }

  updateClient(clientId: string, patch: Partial<Client>): StoreResult<null> {
    const result = mutations.updateClient(this.seed, clientId, patch);
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  updateProfessional(professionalId: string, patch: Partial<Professional>): StoreResult<null> {
    const result = mutations.updateProfessional(this.seed, professionalId, patch);
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  archivePlacement(placementId: string, reason: string): StoreResult<null> {
    const result = mutations.archivePlacement(this.seed, placementId, reason, this.now());
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  logCommunication(input: LogCommunicationInput): StoreResult<null> {
    const result = mutations.logCommunication(this.seed, input, this.now());
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  markCommunicationSent(communicationId: string, nextFollowUpDate?: string): StoreResult<null> {
    const result = mutations.markCommunicationSent(this.seed, communicationId, this.now(), nextFollowUpDate);
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  logOutcome(input: LogOutcomeInput): StoreResult<null> {
    const result = mutations.logOutcome(this.seed, input, this.now());
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  recordFeedback(input: RecordFeedbackInput): StoreResult<null> {
    const result = mutations.recordFeedback(this.seed, input, this.now());
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  recordAttendance(input: RecordAttendanceInput): StoreResult<null> {
    const result = mutations.recordAttendance(this.seed, input, this.now());
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  createIssue(input: CreateIssueInput): StoreResult<Issue> {
    const result = mutations.createIssue(this.seed, input, this.now());
    if (!result.ok) return result;
    this.applySeed(result.value.seed);
    return { ok: true, value: result.value.issue };
  }

  updateIssueStatus(issueId: string, status: Issue["status"]): StoreResult<null> {
    const result = mutations.updateIssueStatus(this.seed, issueId, status, this.now());
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  implementFix(input: ImplementFixInput): StoreResult<null> {
    const result = mutations.implementFix(this.seed, input);
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  confirmIssueFollowupWindow(input: ConfirmFollowupWindowInput): StoreResult<null> {
    const result = mutations.confirmIssueFollowupWindow(this.seed, input);
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  completeFollowup(input: CompleteFollowupInput): StoreResult<null> {
    const result = mutations.completeFollowup(this.seed, input);
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  createEscalation(input: CreateEscalationInput): StoreResult<null> {
    const result = mutations.createEscalation(this.seed, input, this.now());
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }

  updateEscalationStatus(escalationId: string, status: EscalationStatus): StoreResult<null> {
    const result = mutations.updateEscalationStatus(this.seed, escalationId, status, this.now());
    if (!result.ok) return result;
    this.applySeed(result.value);
    return { ok: true, value: null };
  }
}

let singleton: Store | null = null;

export function getStore(): Store {
  if (!singleton) {
    singleton = new Store();
  }
  return singleton;
}
