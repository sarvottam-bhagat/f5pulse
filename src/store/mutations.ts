// Pure mutation functions: (Seed, input) -> { seed, result }. No I/O, no
// localStorage — fully unit-testable. The StorageStore wrapper (store.ts)
// is the only thing that persists the returned seed.

import type { Seed, Client, Professional, Placement, Issue, AuditEntry } from "../domain/types";
import { nextId } from "./id";
import { generateInitialCheckpoints } from "../domain/rules/checkpoints";
import {
  canTransition,
  markFixImplemented as markFixImplementedRule,
  confirmFollowupWindow as confirmFollowupWindowRule,
} from "../domain/rules/issueLifecycle";
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

function audit(seed: Seed, placementId: string, action: string, detail: string, actor: string, at: string): Seed {
  const entry: AuditEntry = { id: nextId("audit"), placementId, action, detail, actor, at };
  return { ...seed, auditLog: [...seed.auditLog, entry] };
}

export function createPlacementBundle(
  seed: Seed,
  input: CreatePlacementBundleInput,
  now: string,
): StoreResult<{ seed: Seed; result: CreatePlacementBundleResult }> {
  let client: Client;
  let nextSeed = seed;

  if (input.client.mode === "existing") {
    const clientId = input.client.clientId;
    const found = seed.clients.find((c) => c.id === clientId && !c.archived);
    if (!found) return { ok: false, error: "Selected client was not found." };
    client = found;
  } else {
    client = {
      id: nextId("client"),
      ...input.client.data,
      notes: input.client.data.notes ?? "",
      archived: false,
      createdAt: now,
    };
    nextSeed = { ...nextSeed, clients: [...nextSeed.clients, client] };
  }

  let professional: Professional;
  if (input.professional.mode === "existing") {
    const professionalId = input.professional.professionalId;
    const found = nextSeed.professionals.find((p) => p.id === professionalId && !p.archived);
    if (!found) return { ok: false, error: "Selected professional was not found." };
    professional = found;
  } else {
    professional = {
      id: nextId("pro"),
      ...input.professional.data,
      notes: input.professional.data.notes ?? "",
      archived: false,
      createdAt: now,
    };
    nextSeed = { ...nextSeed, professionals: [...nextSeed.professionals, professional] };
  }

  // A professional can have only one active full-time placement at a time.
  const hasActivePlacement = nextSeed.placements.some(
    (p) => p.professionalId === professional.id && p.status === "Active" && !p.archived,
  );
  if (hasActivePlacement) {
    return { ok: false, error: "This professional already has an active placement." };
  }

  const placement: Placement = {
    id: nextId("placement"),
    clientId: client.id,
    professionalId: professional.id,
    roleTitle: input.placement.roleTitle,
    startDate: input.placement.startDate,
    trialEndDate: input.placement.trialEndDate,
    f5Owner: input.placement.f5Owner,
    expectedSchedule: input.placement.expectedSchedule,
    initialNotes: input.placement.initialNotes ?? "",
    status: input.placement.status,
    archived: false,
    createdAt: now,
  };

  const { feedback, checkins } = generateInitialCheckpoints(placement, () => nextId("checkpoint"));

  nextSeed = {
    ...nextSeed,
    placements: [...nextSeed.placements, placement],
    feedback: [...nextSeed.feedback, ...feedback],
    checkins: [...nextSeed.checkins, ...checkins],
  };

  nextSeed = audit(
    nextSeed,
    placement.id,
    "placement_created",
    `Placement created for ${client.companyName} / ${professional.fullName}`,
    placement.f5Owner,
    now,
  );

  const firstClientContactDate = feedback[0]?.scheduledFor ?? placement.startDate;
  const firstProfessionalCheckinDate = checkins[0]?.dueDate ?? placement.startDate;

  return {
    ok: true,
    value: {
      seed: nextSeed,
      result: { placement, client, professional, firstClientContactDate, firstProfessionalCheckinDate },
    },
  };
}

export function updateClient(seed: Seed, clientId: string, patch: Partial<Client>): StoreResult<Seed> {
  const idx = seed.clients.findIndex((c) => c.id === clientId);
  if (idx === -1) return { ok: false, error: "Client not found." };
  const clients = [...seed.clients];
  clients[idx] = { ...clients[idx], ...patch, id: clients[idx].id };
  return { ok: true, value: { ...seed, clients } };
}

export function updateProfessional(seed: Seed, professionalId: string, patch: Partial<Professional>): StoreResult<Seed> {
  const idx = seed.professionals.findIndex((p) => p.id === professionalId);
  if (idx === -1) return { ok: false, error: "Professional not found." };
  const professionals = [...seed.professionals];
  professionals[idx] = { ...professionals[idx], ...patch, id: professionals[idx].id };
  return { ok: true, value: { ...seed, professionals } };
}

export function archivePlacement(seed: Seed, placementId: string, reason: string, now: string): StoreResult<Seed> {
  const idx = seed.placements.findIndex((p) => p.id === placementId);
  if (idx === -1) return { ok: false, error: "Placement not found." };
  const placements = [...seed.placements];
  placements[idx] = { ...placements[idx], archived: true, status: "Ended", endedAt: now, endReason: reason };
  let next = { ...seed, placements };
  next = audit(next, placementId, "placement_archived", reason, "system", now);
  return { ok: true, value: next };
}

export function logCommunication(seed: Seed, input: LogCommunicationInput, now: string): StoreResult<Seed> {
  const placement = seed.placements.find((p) => p.id === input.placementId);
  if (!placement) return { ok: false, error: "Placement not found." };
  const record = { id: nextId("comm"), createdAt: now, ...input };
  let next = { ...seed, communications: [...seed.communications, record] };
  next = audit(next, input.placementId, "communication_logged", input.summary, input.owner, now);
  return { ok: true, value: next };
}

export function markCommunicationSent(
  seed: Seed,
  communicationId: string,
  now: string,
  nextFollowUpDate?: string,
): StoreResult<Seed> {
  const idx = seed.communications.findIndex((c) => c.id === communicationId);
  if (idx === -1) return { ok: false, error: "Communication not found." };
  const communications = [...seed.communications];
  communications[idx] = {
    ...communications[idx],
    markedSentAt: now,
    ...(nextFollowUpDate ? { nextFollowUpDate } : {}),
  };
  let next = { ...seed, communications };
  next = audit(
    next,
    communications[idx].placementId,
    "communication_marked_sent",
    communications[idx].summary,
    communications[idx].owner,
    now,
  );
  return { ok: true, value: next };
}

export function logOutcome(seed: Seed, input: LogOutcomeInput, now: string): StoreResult<Seed> {
  const placement = seed.placements.find((p) => p.id === input.placementId);
  if (!placement) return { ok: false, error: "Placement not found." };

  const communication = {
    id: nextId("comm"),
    placementId: input.placementId,
    subjectType: input.subjectType,
    channel: "phone" as const,
    direction: "outbound" as const,
    outcome: input.outcome,
    sentiment: input.sentiment,
    summary: input.summary,
    commitment: input.commitment,
    owner: input.owner,
    nextFollowUpDate: input.nextFollowUpDate,
    createdAt: now,
  };
  let next: Seed = { ...seed, communications: [...seed.communications, communication] };

  if (input.nextFollowUpDate) {
    next = {
      ...next,
      followups: [
        ...next.followups,
        {
          id: nextId("followup"),
          placementId: input.placementId,
          dueDate: input.nextFollowUpDate,
          description: input.commitment || "Follow up on logged outcome.",
          owner: input.owner,
          createdAt: now,
        },
      ],
    };
  }

  if (input.createIssue) {
    const issue: Issue = {
      id: nextId("issue"),
      placementId: input.placementId,
      title: `Issue from ${input.subjectType} outcome log`,
      description: input.summary,
      source: input.subjectType === "client" ? "client_complaint" : "performance",
      severity: "medium",
      status: "Reported",
      owner: input.owner,
      ownerAssignedAt: now,
      followupWindows: [],
      recurrenceCount: 0,
      reportedAt: now,
      reopenedCount: 0,
      createdAt: now,
    };
    next = { ...next, issues: [...next.issues, issue] };
  }

  if (input.escalate) {
    next = {
      ...next,
      escalations: [
        ...next.escalations,
        {
          id: nextId("escalation"),
          placementId: input.placementId,
          reason: "cancellation_or_replacement_mentioned",
          status: "open",
          summary: input.summary,
          raisedAt: now,
          createdAt: now,
        },
      ],
    };
  }

  next = audit(next, input.placementId, "outcome_logged", input.summary, input.owner, now);
  return { ok: true, value: next };
}

export function recordFeedback(seed: Seed, input: RecordFeedbackInput, now: string): StoreResult<Seed> {
  const placement = seed.placements.find((p) => p.id === input.placementId);
  if (!placement) return { ok: false, error: "Placement not found." };

  let feedback = seed.feedback;
  if (input.feedbackId) {
    const idx = feedback.findIndex((f) => f.id === input.feedbackId);
    if (idx === -1) return { ok: false, error: "Feedback checkpoint not found." };
    feedback = [...feedback];
    feedback[idx] = {
      ...feedback[idx],
      collectedAt: input.collectedAt,
      sentiment: input.sentiment,
      summary: input.summary,
      attemptCount: feedback[idx].attemptCount + 1,
    };
  } else {
    feedback = [
      ...feedback,
      {
        id: nextId("feedback"),
        placementId: input.placementId,
        subjectType: input.subjectType,
        scheduledFor: input.collectedAt.slice(0, 10),
        collectedAt: input.collectedAt,
        sentiment: input.sentiment,
        summary: input.summary,
        attemptCount: 1,
        isTrialCheckpoint: false,
        dayOffset: 0,
        createdAt: now,
      },
    ];
  }

  let next: Seed = { ...seed, feedback };

  // Negative client feedback creates an issue.
  if (input.subjectType === "client" && input.sentiment === "negative") {
    next = {
      ...next,
      issues: [
        ...next.issues,
        {
          id: nextId("issue"),
          placementId: input.placementId,
          title: "Negative client feedback",
          description: input.summary,
          source: "feedback_negative",
          severity: "high",
          status: "Reported",
          followupWindows: [],
          recurrenceCount: 0,
          reportedAt: now,
          reopenedCount: 0,
          createdAt: now,
        },
      ],
    };
  }

  next = audit(next, input.placementId, "feedback_recorded", input.summary, "operator", now);
  return { ok: true, value: next };
}

export function recordAttendance(seed: Seed, input: RecordAttendanceInput, now: string): StoreResult<Seed> {
  const placement = seed.placements.find((p) => p.id === input.placementId);
  if (!placement) return { ok: false, error: "Placement not found." };
  const record = { id: nextId("attendance"), createdAt: now, ...input };
  let next = { ...seed, attendance: [...seed.attendance, record] };
  next = audit(next, input.placementId, "attendance_recorded", `${input.eventType} on ${input.date}`, "operator", now);
  return { ok: true, value: next };
}

export function createIssue(seed: Seed, input: CreateIssueInput, now: string): StoreResult<{ seed: Seed; issue: Issue }> {
  const placement = seed.placements.find((p) => p.id === input.placementId);
  if (!placement) return { ok: false, error: "Placement not found." };
  const issue: Issue = {
    id: nextId("issue"),
    placementId: input.placementId,
    title: input.title,
    description: input.description,
    source: input.source,
    severity: input.severity,
    status: "Reported",
    owner: input.owner,
    ownerAssignedAt: input.owner ? now : undefined,
    followupWindows: [],
    recurrenceCount: 0,
    reportedAt: now,
    reopenedCount: 0,
    createdAt: now,
  };
  let next = { ...seed, issues: [...seed.issues, issue] };
  next = audit(next, input.placementId, "issue_created", input.title, input.owner ?? "operator", now);
  return { ok: true, value: { seed: next, issue } };
}

export function updateIssueStatus(seed: Seed, issueId: string, status: Issue["status"], now: string): StoreResult<Seed> {
  const idx = seed.issues.findIndex((i) => i.id === issueId);
  if (idx === -1) return { ok: false, error: "Issue not found." };
  const current = seed.issues[idx];
  if (current.status !== status && !canTransition(current.status, status)) {
    return { ok: false, error: `Cannot move issue from "${current.status}" to "${status}".` };
  }
  const issues = [...seed.issues];
  issues[idx] = { ...current, status };
  let next = { ...seed, issues };
  next = audit(next, issues[idx].placementId, "issue_status_changed", `${issueId} -> ${status}`, "operator", now);
  return { ok: true, value: next };
}

export function implementFix(seed: Seed, input: ImplementFixInput): StoreResult<Seed> {
  const idx = seed.issues.findIndex((i) => i.id === input.issueId);
  if (idx === -1) return { ok: false, error: "Issue not found." };
  const { issue, error } = markFixImplementedRule(seed.issues[idx], input.fixDescription, input.at);
  if (error) return { ok: false, error };
  const issues = [...seed.issues];
  issues[idx] = issue;
  let next = { ...seed, issues };
  next = audit(next, issue.placementId, "fix_implemented", input.fixDescription, "operator", input.at);
  return { ok: true, value: next };
}

export function confirmIssueFollowupWindow(seed: Seed, input: ConfirmFollowupWindowInput): StoreResult<Seed> {
  const idx = seed.issues.findIndex((i) => i.id === input.issueId);
  if (idx === -1) return { ok: false, error: "Issue not found." };
  const { issue, error, escalationTriggered } = confirmFollowupWindowRule(
    seed.issues[idx],
    input.windowId,
    input.outcome,
    input.at,
  );
  if (error) return { ok: false, error };
  const issues = [...seed.issues];
  issues[idx] = issue;
  let next: Seed = { ...seed, issues };

  if (escalationTriggered) {
    next = {
      ...next,
      escalations: [
        ...next.escalations,
        {
          id: nextId("escalation"),
          placementId: issue.placementId,
          reason: "recurrence_during_monitoring",
          status: "open",
          relatedIssueId: issue.id,
          summary: `Issue "${issue.title}" recurred during its monitoring window.`,
          raisedAt: input.at,
          createdAt: input.at,
        },
      ],
    };
  }

  next = audit(
    next,
    issue.placementId,
    "followup_window_confirmed",
    `${input.windowId}: ${input.outcome}`,
    "operator",
    input.at,
  );
  return { ok: true, value: next };
}

export function completeFollowup(seed: Seed, input: CompleteFollowupInput): StoreResult<Seed> {
  const idx = seed.followups.findIndex((f) => f.id === input.followupId);
  if (idx === -1) return { ok: false, error: "Follow-up not found." };
  const followups = [...seed.followups];
  followups[idx] = { ...followups[idx], completedAt: input.completedAt, outcome: input.outcome };
  let next = { ...seed, followups };
  next = audit(next, followups[idx].placementId, "followup_completed", input.outcome, "operator", input.completedAt);
  return { ok: true, value: next };
}

export function createEscalation(seed: Seed, input: CreateEscalationInput, now: string): StoreResult<Seed> {
  const placement = seed.placements.find((p) => p.id === input.placementId);
  if (!placement) return { ok: false, error: "Placement not found." };
  const escalation = {
    id: nextId("escalation"),
    placementId: input.placementId,
    reason: input.reason,
    status: "open" as const,
    relatedIssueId: input.relatedIssueId,
    summary: input.summary,
    escalatedTo: input.escalatedTo,
    raisedAt: now,
    createdAt: now,
  };
  let next = { ...seed, escalations: [...seed.escalations, escalation] };
  next = audit(next, input.placementId, "escalation_created", input.summary, "operator", now);
  return { ok: true, value: next };
}
