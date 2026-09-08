// Issue lifecycle state machine: Reported -> Investigating -> Fix in
// progress -> Monitoring -> Closed. Enforces that Fix in progress cannot
// jump directly to Closed, and derives follow-up windows / recurrence /
// escalation side effects.

import type { Issue, IssueStatus, IssueFollowupWindow } from "../types";
import { addHours } from "../dates";
import { FOLLOWUP_WINDOWS_AFTER_FIX } from "../cadence";

const ALLOWED_TRANSITIONS: Record<IssueStatus, IssueStatus[]> = {
  Reported: ["Investigating", "Closed"],
  Investigating: ["Fix in progress", "Closed"],
  "Fix in progress": ["Monitoring"], // cannot go directly to Closed
  Monitoring: ["Closed", "Fix in progress"], // recurrence during monitoring reopens the fix
  Closed: ["Reported"], // failed confirmation / reopen
};

export function canTransition(from: IssueStatus, to: IssueStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface TransitionResult {
  issue: Issue;
  error?: string;
}

/**
 * Marks a fix as implemented: moves the issue to Monitoring and generates
 * the 24h / 3d / 7d follow-up confirmation windows.
 */
export function markFixImplemented(issue: Issue, fixDescription: string, at: string): TransitionResult {
  if (!canTransition(issue.status, "Monitoring")) {
    return { issue, error: `Cannot mark fix implemented from status "${issue.status}"` };
  }
  const followupWindows: IssueFollowupWindow[] = FOLLOWUP_WINDOWS_AFTER_FIX.map((w, i) => ({
    id: `${issue.id}_fwin_${i}`,
    dueAt: addHours(at, w.hours),
    windowLabel: w.label,
  }));
  return {
    issue: {
      ...issue,
      status: "Monitoring",
      fixImplementedAt: at,
      fixDescription,
      followupWindows,
    },
  };
}

/**
 * Confirms a follow-up window: "held" progresses toward closing once all
 * windows confirm held; "recurred" reopens the issue to Fix in progress
 * and creates a mandatory escalation (recurrence during monitoring).
 */
export function confirmFollowupWindow(
  issue: Issue,
  windowId: string,
  outcome: "held" | "recurred",
  at: string,
): TransitionResult & { escalationTriggered: boolean } {
  const windowIndex = issue.followupWindows.findIndex((w) => w.id === windowId);
  if (windowIndex === -1) {
    return { issue, error: "Follow-up window not found", escalationTriggered: false };
  }

  const updatedWindows = issue.followupWindows.map((w, i) =>
    i === windowIndex ? { ...w, completedAt: at, outcome } : w,
  );

  if (outcome === "recurred") {
    return {
      issue: {
        ...issue,
        status: "Fix in progress",
        followupWindows: updatedWindows,
        recurrenceCount: issue.recurrenceCount + 1,
      },
      escalationTriggered: true,
    };
  }

  const allHeld = updatedWindows.every((w) => w.outcome === "held");
  const nextStatus: IssueStatus = allHeld ? "Closed" : issue.status;

  return {
    issue: {
      ...issue,
      status: nextStatus,
      followupWindows: updatedWindows,
      ...(nextStatus === "Closed" ? { closedAt: at } : {}),
    },
    escalationTriggered: false,
  };
}

/** Failed confirmation (client/professional reports the fix did not hold outside a formal window) reopens the issue. */
export function reopenIssue(issue: Issue, at: string): TransitionResult {
  if (!canTransition(issue.status, "Reported")) {
    return { issue, error: `Cannot reopen from status "${issue.status}"` };
  }
  return {
    issue: {
      ...issue,
      status: "Reported",
      reopenedCount: issue.reopenedCount + 1,
      fixImplementedAt: undefined,
      followupWindows: [],
    },
  };
}

/**
 * Returns follow-up windows that are due and not yet completed. `asOf` is a
 * date-only string (YYYY-MM-DD); a window is "due" once its calendar date
 * has arrived, regardless of its time-of-day component, so a window due
 * later today still surfaces on today's queue.
 */
export function dueFollowupWindows(issue: Issue, asOf: string): IssueFollowupWindow[] {
  return issue.followupWindows.filter((w) => !w.completedAt && w.dueAt.slice(0, 10) <= asOf);
}
