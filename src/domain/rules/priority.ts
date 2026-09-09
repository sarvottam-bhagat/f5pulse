// Priority queue: buckets each placement's outstanding work into
// Escalate now / Contact today / Confirm the fix held / Next three days,
// producing one card per actionable item with the fields the Home
// dashboard needs to render directly.

import { addDays } from "../dates";
import type { PlacementContext } from "./context";
import { assessHealth } from "./health";
import { assessSilence } from "./silence";
import { detectMandatoryEscalations } from "./escalation";
import { dueFollowupWindows } from "./issueLifecycle";
import type { EscalationReason, HealthState } from "../types";

export type PrioritySection = "escalate_now" | "contact_today" | "confirm_fix_held" | "next_three_days";
export type RiskLevel = "critical" | "high" | "medium" | "low";
export type RecommendedAction =
  | "log_outcome"
  | "record_feedback"
  | "investigate_in_chat"
  | "create_issue"
  | "schedule_followup"
  | "escalate"
  | "confirm_fix";

export interface PriorityCard {
  id: string;
  section: PrioritySection;
  placementId: string;
  clientName: string;
  professionalName: string;
  contactWho: "client" | "professional";
  reason: string;
  riskLevel: RiskLevel;
  evidence: string[];
  dueAt: string; // ISO date or datetime
  recommendedAction: RecommendedAction;
  whyHere: string;
  healthState: HealthState;
  /** Set when recommendedAction is "confirm_fix": identifies the issue and window to confirm. */
  issueId?: string;
  windowId?: string;
  /** Exact rule that put this placement in the escalation queue. */
  escalationReason?: EscalationReason;
}

function riskFromHealth(state: HealthState): RiskLevel {
  switch (state) {
    case "Critical":
      return "critical";
    case "At Risk":
      return "high";
    case "Watch":
      return "medium";
    default:
      return "low";
  }
}

export function buildPriorityQueue(contexts: PlacementContext[], asOf: string): PriorityCard[] {
  const cards: PriorityCard[] = [];
  const horizon = addDays(asOf, 3);

  for (const ctx of contexts) {
    const health = assessHealth(ctx, asOf);
    const silence = assessSilence(ctx, asOf);
    const mandatoryTriggers = detectMandatoryEscalations(ctx, asOf);
    const recordedEscalations = ctx.escalations.filter(
      (escalation) => escalation.status !== "resolved" && Boolean(escalation.raisedBy),
    );
    const pendingEscalations = ctx.escalations.filter(
      (escalation) => escalation.status !== "resolved" && !escalation.raisedBy,
    );

    // Once raised, the escalation is tracked in history and no longer asks the
    // operator to raise the same placement again.
    if (recordedEscalations.length > 0) continue;

    // --- Escalate now: freshly-detected mandatory triggers ---
    if (pendingEscalations.length > 0 || mandatoryTriggers.length > 0) {
      const evidence = [
        ...pendingEscalations.map((escalation) => escalation.summary),
        ...mandatoryTriggers.map((trigger) => trigger.detail),
      ];
      cards.push({
        id: `${ctx.placement.id}_escalate`,
        section: "escalate_now",
        placementId: ctx.placement.id,
        clientName: ctx.client.companyName,
        professionalName: ctx.professional.fullName,
        contactWho: "client",
        reason: evidence[0] ?? "Mandatory escalation condition met",
        riskLevel: "critical",
        evidence,
        dueAt: asOf,
        recommendedAction: "escalate",
        whyHere: "This placement meets one or more mandatory-escalation conditions and needs senior attention now.",
        healthState: health.state,
        escalationReason: pendingEscalations[0]?.reason ?? mandatoryTriggers[0].reason,
      });
      continue; // an escalating placement doesn't also compete for other buckets today
    }

    // --- Confirm the fix held: due follow-up confirmation windows ---
    const issuesWithDueWindows = ctx.issues
      .map((issue) => ({ issue, due: dueFollowupWindows(issue, asOf) }))
      .filter((x) => x.due.length > 0);
    if (issuesWithDueWindows.length > 0) {
      for (const { issue, due } of issuesWithDueWindows) {
        cards.push({
          id: `${ctx.placement.id}_confirm_${issue.id}`,
          section: "confirm_fix_held",
          placementId: ctx.placement.id,
          clientName: ctx.client.companyName,
          professionalName: ctx.professional.fullName,
          contactWho: issue.source === "client_complaint" ? "client" : "professional",
          reason: `Confirm fix held for "${issue.title}" (${due[0].windowLabel} check)`,
          riskLevel: riskFromHealth(health.state),
          evidence: [issue.fixDescription ?? "Fix implemented", `${due.length} confirmation window(s) due`],
          dueAt: due[0].dueAt,
          recommendedAction: "confirm_fix",
          issueId: issue.id,
          windowId: due[0].id,
          whyHere: `A fix was implemented on ${issue.fixImplementedAt?.slice(0, 10)} and its ${due[0].windowLabel} confirmation window is now due.`,
          healthState: health.state,
        });
      }
    }

    // --- Contact today: silence risk or a due-today feedback/checkin checkpoint ---
    const dueTodayFeedback = ctx.feedback.find(
      (f) => f.subjectType === "client" && !f.collectedAt && f.scheduledFor <= asOf,
    );
    if (silence.level !== "none" || dueTodayFeedback) {
      const evidence: string[] = [];
      if (silence.reason) evidence.push(silence.reason);
      if (dueTodayFeedback) evidence.push(`Feedback checkpoint due ${dueTodayFeedback.scheduledFor}`);
      cards.push({
        id: `${ctx.placement.id}_contact_client`,
        section: "contact_today",
        placementId: ctx.placement.id,
        clientName: ctx.client.companyName,
        professionalName: ctx.professional.fullName,
        contactWho: "client",
        reason: silence.level === "at_risk"
          ? "Client has gone silent past the at-risk threshold"
          : dueTodayFeedback
            ? "Scheduled feedback checkpoint is due"
            : "Client feedback checkpoint is overdue",
        riskLevel: silence.level === "at_risk" ? "high" : riskFromHealth(health.state),
        evidence: evidence.length > 0 ? evidence : ["Feedback checkpoint due"],
        dueAt: dueTodayFeedback?.scheduledFor ?? asOf,
        recommendedAction: silence.level !== "none" ? "log_outcome" : "record_feedback",
        whyHere:
          silence.level === "at_risk"
            ? "Two or more unanswered attempts, or an overdue checkpoint past the at-risk threshold — silence is the leading indicator of client churn."
            : "A scheduled client feedback checkpoint is due today or overdue.",
        healthState: health.state,
      });
    }

    const overdueProfessionalCheckin = ctx.checkins.find(
      (c) => c.subjectType === "professional" && c.status !== "completed" && c.dueDate <= asOf,
    );
    if (overdueProfessionalCheckin) {
      cards.push({
        id: `${ctx.placement.id}_contact_professional`,
        section: "contact_today",
        placementId: ctx.placement.id,
        clientName: ctx.client.companyName,
        professionalName: ctx.professional.fullName,
        contactWho: "professional",
        reason: "Professional check-in is due or overdue",
        riskLevel: riskFromHealth(health.state),
        evidence: [`Check-in was due ${overdueProfessionalCheckin.dueDate}`],
        dueAt: overdueProfessionalCheckin.dueDate,
        recommendedAction: "log_outcome",
        whyHere: "A scheduled professional check-in has not been completed on time.",
        healthState: health.state,
      });
    }

    const unresolvedNonClosedIssue = ctx.issues.find(
      (i) => i.status !== "Closed" && i.status !== "Monitoring" && (i.severity === "high" || i.severity === "critical"),
    );
    if (unresolvedNonClosedIssue && !dueTodayFeedback && silence.level === "none") {
      cards.push({
        id: `${ctx.placement.id}_contact_issue_${unresolvedNonClosedIssue.id}`,
        section: "contact_today",
        placementId: ctx.placement.id,
        clientName: ctx.client.companyName,
        professionalName: ctx.professional.fullName,
        contactWho: unresolvedNonClosedIssue.source === "client_complaint" ? "client" : "professional",
        reason: `Unresolved ${unresolvedNonClosedIssue.severity}-severity issue needs progress`,
        riskLevel: riskFromHealth(health.state),
        evidence: [`"${unresolvedNonClosedIssue.title}" is ${unresolvedNonClosedIssue.status}`],
        dueAt: asOf,
        recommendedAction: "create_issue",
        whyHere: `A ${unresolvedNonClosedIssue.severity}-severity issue is still open and needs an update or a fix.`,
        healthState: health.state,
      });
    }

    // --- Next three days: upcoming checkpoints not yet due ---
    const upcomingFeedback = ctx.feedback.filter(
      (f) => f.subjectType === "client" && !f.collectedAt && f.scheduledFor > asOf && f.scheduledFor <= horizon,
    );
    for (const f of upcomingFeedback) {
      cards.push({
        id: `${ctx.placement.id}_upcoming_feedback_${f.id}`,
        section: "next_three_days",
        placementId: ctx.placement.id,
        clientName: ctx.client.companyName,
        professionalName: ctx.professional.fullName,
        contactWho: "client",
        reason: `Client feedback checkpoint coming up (day ${f.dayOffset})`,
        riskLevel: "low",
        evidence: [`Scheduled for ${f.scheduledFor}`],
        dueAt: f.scheduledFor,
        recommendedAction: "schedule_followup",
        whyHere: "Upcoming scheduled checkpoint within the next three days.",
        healthState: health.state,
      });
    }

    const upcomingCheckins = ctx.checkins.filter(
      (c) => c.status === "scheduled" && c.dueDate > asOf && c.dueDate <= horizon,
    );
    for (const c of upcomingCheckins) {
      cards.push({
        id: `${ctx.placement.id}_upcoming_checkin_${c.id}`,
        section: "next_three_days",
        placementId: ctx.placement.id,
        clientName: ctx.client.companyName,
        professionalName: ctx.professional.fullName,
        contactWho: c.subjectType,
        reason: `${c.subjectType === "client" ? "Client" : "Professional"} check-in coming up`,
        riskLevel: "low",
        evidence: [`Scheduled for ${c.dueDate}`],
        dueAt: c.dueDate,
        recommendedAction: "schedule_followup",
        whyHere: "Upcoming scheduled checkpoint within the next three days.",
        healthState: health.state,
      });
    }
  }

  return sortPriorityCards(cards);
}

const SECTION_ORDER: PrioritySection[] = ["escalate_now", "contact_today", "confirm_fix_held", "next_three_days"];
const RISK_ORDER: RiskLevel[] = ["critical", "high", "medium", "low"];

export function sortPriorityCards(cards: PriorityCard[]): PriorityCard[] {
  return [...cards].sort((a, b) => {
    const sectionDiff = SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section);
    if (sectionDiff !== 0) return sectionDiff;
    const riskDiff = RISK_ORDER.indexOf(a.riskLevel) - RISK_ORDER.indexOf(b.riskLevel);
    if (riskDiff !== 0) return riskDiff;
    return a.dueAt < b.dueAt ? -1 : a.dueAt > b.dueAt ? 1 : 0;
  });
}

export function groupBySection(cards: PriorityCard[]): Record<PrioritySection, PriorityCard[]> {
  const groups: Record<PrioritySection, PriorityCard[]> = {
    escalate_now: [],
    contact_today: [],
    confirm_fix_held: [],
    next_three_days: [],
  };
  for (const card of cards) {
    groups[card.section].push(card);
  }
  return groups;
}

export function buildDashboardLanes(cards: PriorityCard[]): {
  attention: PriorityCard[];
  upcoming: PriorityCard[];
} {
  return {
    attention: cards.filter((card) => card.section !== "next_three_days"),
    upcoming: cards.filter((card) => card.section === "next_three_days"),
  };
}

export function resolveDashboardLane(
  current: "attention" | "upcoming",
  attentionCount: number,
  upcomingCount: number,
): "attention" | "upcoming" {
  if (current === "upcoming" && upcomingCount === 0 && attentionCount > 0) return "attention";
  if (current === "attention" && attentionCount === 0 && upcomingCount > 0) return "upcoming";
  return current;
}
