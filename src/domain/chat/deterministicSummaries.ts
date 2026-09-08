// Deterministic (non-AI) summaries, talking points, and communication
// templates built purely from rules-engine output. These remain available
// if the AI service fails, and back every Chat capability with a
// guaranteed-correct fallback.

import type { PlacementContext } from "../rules/context";
import { assessHealth } from "../rules/health";
import { assessSilence } from "../rules/silence";
import { detectMandatoryEscalations } from "../rules/escalation";
import type { ChatViewMode } from "./types";

export function summarizePlacement(ctx: PlacementContext, asOf: string): string {
  const health = assessHealth(ctx, asOf);
  const lines = [
    `${ctx.client.companyName} × ${ctx.professional.fullName} (${ctx.placement.roleTitle}).`,
    `Started ${ctx.placement.startDate}, trial ends ${ctx.placement.trialEndDate}, status: ${ctx.placement.status}.`,
    `Health: ${health.state}.`,
  ];
  if (health.reasons.length > 0) {
    lines.push("Reasons: " + health.reasons.join("; "));
  }
  const openIssues = ctx.issues.filter((i) => i.status !== "Closed");
  if (openIssues.length > 0) {
    lines.push(`Open issues: ${openIssues.map((i) => `"${i.title}" (${i.status})`).join(", ")}.`);
  }
  const openEscalations = ctx.escalations.filter((e) => e.status !== "resolved");
  if (openEscalations.length > 0) {
    lines.push(`Open escalations: ${openEscalations.map((e) => e.summary).join("; ")}.`);
  }
  return lines.join(" ");
}

export function explainRisk(ctx: PlacementContext, asOf: string): string {
  const health = assessHealth(ctx, asOf);
  if (health.state === "Healthy") {
    return "This placement is currently healthy — no overdue checkpoints, unresolved issues, or negative signals.";
  }
  return `This placement is at "${health.state}" because: ${health.reasons.join("; ")}.`;
}

export function talkingPoints(ctx: PlacementContext, asOf: string, view: ChatViewMode): string[] {
  const points: string[] = [];
  if (view === "client") {
    const silence = assessSilence(ctx, asOf);
    if (silence.level !== "none") {
      points.push(`Acknowledge the gap in communication${silence.reason ? ` (${silence.reason})` : ""}.`);
    }
    const negativeFeedback = ctx.feedback.filter((f) => f.sentiment === "negative");
    for (const f of negativeFeedback.slice(0, 2)) {
      points.push(`Address prior feedback: "${f.summary}"`);
    }
    const openIssues = ctx.issues.filter((i) => i.status !== "Closed" && i.source === "client_complaint");
    for (const i of openIssues) {
      points.push(`Give a status update on: "${i.title}" (currently ${i.status}).`);
    }
    if (points.length === 0) points.push("Confirm satisfaction and ask if anything needs adjusting.");
  } else {
    const attendanceConcerns = ctx.attendance.filter((a) => a.eventType !== "on_time");
    if (attendanceConcerns.length > 0) {
      points.push(`Discuss ${attendanceConcerns.length} attendance exception(s) on record.`);
    }
    const openIssues = ctx.issues.filter((i) => i.status !== "Closed" && i.source !== "client_complaint");
    for (const i of openIssues) {
      points.push(`Coach on: "${i.title}" — ${i.description}`);
    }
    if (points.length === 0) points.push("Check in on workload, blockers, and wellbeing.");
  }
  return points;
}

export function compareComplaintsWithHistory(ctx: PlacementContext): string {
  const complaints = ctx.issues.filter((i) => i.source === "client_complaint");
  const attendanceIssues = ctx.attendance.filter((a) => a.eventType !== "on_time");
  if (complaints.length === 0) {
    return "No client complaints on record for this placement.";
  }
  const parts = [`${complaints.length} client complaint(s) on record.`];
  if (attendanceIssues.length > 0) {
    parts.push(`${attendanceIssues.length} attendance exception(s) coincide with this period — worth cross-checking timing.`);
  } else {
    parts.push("No attendance exceptions on record, so this looks like a standalone quality/communication concern rather than attendance-driven.");
  }
  return parts.join(" ");
}

export function recommendEscalation(ctx: PlacementContext, asOf: string): string {
  const triggers = detectMandatoryEscalations(ctx, asOf);
  if (triggers.length === 0) {
    return "No mandatory-escalation conditions are currently met for this placement.";
  }
  return `Escalation recommended: ${triggers.map((t) => t.detail).join(" ")}`;
}

export function draftFeedbackRequest(ctx: PlacementContext): string {
  return `Hi ${ctx.client.primaryContactName},\n\nJust checking in on how things are going with ${ctx.professional.fullName} on the ${ctx.placement.roleTitle} role. Would love to hear your thoughts — anything working well, or anything we should adjust?\n\nThanks,\n${ctx.placement.f5Owner}`;
}

export function draftComplaintResponse(ctx: PlacementContext, complaintSummary: string): string {
  return `Hi ${ctx.client.primaryContactName},\n\nThank you for flagging this — I want to make sure we address it properly. Here's what I understand: ${complaintSummary}\n\nHere's what we're doing about it: [describe the fix]. I'll follow up within a few days to confirm this has resolved the issue.\n\nBest,\n${ctx.placement.f5Owner}`;
}

export function draftCoachingEmail(ctx: PlacementContext, concernSummary: string): string {
  return `Hi ${ctx.professional.fullName},\n\nWanted to check in about ${concernSummary}. Let's find some time to talk through what's going on and how F5 can support you.\n\nBest,\n${ctx.professional.f5Manager}`;
}

export function recommendIssueResolutions(ctx: PlacementContext): string[] {
  return ctx.issues
    .filter((i) => i.status !== "Closed")
    .map((i) => `"${i.title}" (${i.status}, ${i.severity}): ${i.status === "Reported" ? "assign an owner and begin investigation." : i.status === "Investigating" ? "identify root cause and propose a fix." : i.status === "Fix in progress" ? "implement the fix and start the confirmation window." : "confirm the fix held before closing."}`);
}

export function identifyRequiredFollowups(ctx: PlacementContext, asOf: string): string[] {
  const items: string[] = [];
  for (const f of ctx.followups) {
    if (!f.completedAt && f.dueDate <= asOf) {
      items.push(`Follow-up overdue: ${f.description} (due ${f.dueDate})`);
    }
  }
  for (const issue of ctx.issues) {
    for (const w of issue.followupWindows) {
      if (!w.completedAt && w.dueAt.slice(0, 10) <= asOf) {
        items.push(`Confirm ${w.windowLabel} fix-hold window for "${issue.title}".`);
      }
    }
  }
  return items;
}
