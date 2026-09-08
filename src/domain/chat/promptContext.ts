// Builds the context string given to the LLM: a compact, factual summary
// of the attached placement so the model reasons over real data instead of
// hallucinating specifics. Kept separate from deterministicSummaries.ts,
// which produces user-facing fallback text rather than model input.

import type { PlacementContext } from "../rules/context";
import { assessHealth } from "../rules/health";
import type { ChatViewMode } from "./types";

export function buildPlacementPromptContext(ctx: PlacementContext, asOf: string, viewMode: ChatViewMode): string {
  const health = assessHealth(ctx, asOf);
  const lines: string[] = [];

  lines.push(`PLACEMENT: ${ctx.placement.roleTitle} at ${ctx.client.companyName}`);
  lines.push(`Client: ${ctx.client.companyName} (${ctx.client.industry}), contact ${ctx.client.primaryContactName} (${ctx.client.contactTitle})`);
  lines.push(`Professional: ${ctx.professional.fullName} (${ctx.professional.role}), F5 manager ${ctx.professional.f5Manager}`);
  lines.push(`Status: ${ctx.placement.status}. Start: ${ctx.placement.startDate}. Trial ends: ${ctx.placement.trialEndDate}.`);
  lines.push(`Health: ${health.state}. Reasons: ${health.reasons.join("; ")}`);
  lines.push(`Viewing from: ${viewMode} perspective.`);

  const openIssues = ctx.issues.filter((i) => i.status !== "Closed");
  if (openIssues.length > 0) {
    lines.push("Open issues:");
    for (const i of openIssues) {
      lines.push(`- [${i.severity}] "${i.title}" (${i.status}): ${i.description}`);
    }
  }

  const openEscalations = ctx.escalations.filter((e) => e.status !== "resolved");
  if (openEscalations.length > 0) {
    lines.push("Open escalations:");
    for (const e of openEscalations) {
      lines.push(`- ${e.reason}: ${e.summary}`);
    }
  }

  const recentFeedback = ctx.feedback.filter((f) => f.collectedAt).slice(-5);
  if (recentFeedback.length > 0) {
    lines.push("Recent feedback:");
    for (const f of recentFeedback) {
      lines.push(`- [${f.subjectType}, ${f.sentiment ?? "n/a"}] ${f.summary ?? "(no summary)"}`);
    }
  }

  const recentAttendance = ctx.attendance.filter((a) => a.eventType !== "on_time").slice(-5);
  if (recentAttendance.length > 0) {
    lines.push("Attendance exceptions:");
    for (const a of recentAttendance) {
      lines.push(`- ${a.date}: ${a.eventType}${a.notes ? ` — ${a.notes}` : ""}`);
    }
  }

  const recentComms = ctx.communications.slice(-5);
  if (recentComms.length > 0) {
    lines.push("Recent communications:");
    for (const c of recentComms) {
      lines.push(`- [${c.channel}, ${c.direction}] ${c.summary}`);
    }
  }

  return lines.join("\n");
}

export const CHAT_SYSTEM_PROMPT = `You are the AI assistant inside F5 Pulse, an internal tool that helps an F5 operations person manage placements of remote professionals with US client businesses.

You are given factual context about ONE placement below. Answer only using that context — do not invent facts, names, dates, or figures not present in it.

You can: summarize the placement, explain why it's at risk, prepare call talking points, compare complaints with attendance/history, recommend escalation, draft client feedback requests, draft complaint responses, draft professional coaching emails, create improvement plans, recommend issue resolutions, and identify required follow-ups.

You CANNOT modify any data directly. If the operator would benefit from taking an action (log contact, record feedback, create issue, schedule follow-up, mark fix implemented, create escalation, start replacement review), end your response with a line starting with "PROPOSED_ACTION:" followed by a compact JSON object describing it, so the app can render a confirm button. Only propose actions when they are clearly warranted by the context. Never claim you have already performed an action — the operator must confirm it.

Keep responses concise and operational, not conversational filler.`;
