"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import type { PriorityCard } from "@/domain/rules";
import { useStore } from "@/store/useStore";
import type { Sentiment } from "@/domain/types";

/**
 * A single action sheet that adapts its fields based on the card's
 * recommendedAction. Covers: Log outcome, Record feedback, Create issue,
 * Schedule follow-up, Escalate, Confirm fix held.
 */
export function ActionSheet({
  card,
  onClose,
}: {
  card: PriorityCard | null;
  onClose: () => void;
}) {
  const store = useStore();
  const [outcome, setOutcome] = useState<"reached" | "no_answer">("reached");
  const [sentiment, setSentiment] = useState<Sentiment>("neutral");
  const [summary, setSummary] = useState("");
  const [commitment, setCommitment] = useState("");
  const [owner, setOwner] = useState("Jamie Ortiz");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [createIssueToggle, setCreateIssueToggle] = useState(false);
  const [escalateToggle, setEscalateToggle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!card) return null;

  function reset() {
    setOutcome("reached");
    setSentiment("neutral");
    setSummary("");
    setCommitment("");
    setNextFollowUpDate("");
    setCreateIssueToggle(false);
    setEscalateToggle(false);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function submitLogOutcome() {
    if (!card) return;
    if (!summary.trim()) {
      setError("Please add a short summary before saving.");
      return;
    }
    const result = store.logOutcome({
      placementId: card.placementId,
      subjectType: card.contactWho,
      outcome,
      sentiment,
      summary: summary.trim(),
      commitment: commitment.trim() || undefined,
      owner,
      nextFollowUpDate: nextFollowUpDate || undefined,
      createIssue: createIssueToggle,
      escalate: escalateToggle,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    handleClose();
  }

  function submitRecordFeedback() {
    if (!card) return;
    if (!summary.trim()) {
      setError("Please add a short summary before saving.");
      return;
    }
    const feedbackId = card.id.includes("_contact_client") ? undefined : undefined;
    const result = store.recordFeedback({
      placementId: card.placementId,
      feedbackId,
      subjectType: "client",
      sentiment,
      summary: summary.trim(),
      collectedAt: new Date().toISOString(),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    handleClose();
  }

  function submitEscalate() {
    if (!card) return;
    if (!summary.trim()) {
      setError("Please describe why this needs to be escalated.");
      return;
    }
    const result = store.createEscalation({
      placementId: card.placementId,
      reason: "cancellation_or_replacement_mentioned",
      summary: summary.trim(),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    handleClose();
  }

  function submitCreateIssue() {
    if (!card) return;
    if (!summary.trim()) {
      setError("Please describe the issue.");
      return;
    }
    const result = store.createIssue({
      placementId: card.placementId,
      title: summary.trim().slice(0, 80),
      description: summary.trim(),
      source: card.contactWho === "client" ? "client_complaint" : "performance",
      severity: "medium",
      owner,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    handleClose();
  }

  function submitConfirmFix(outcomeChoice: "held" | "recurred") {
    if (!card || !card.issueId || !card.windowId) return;
    const result = store.confirmIssueFollowupWindow({
      issueId: card.issueId,
      windowId: card.windowId,
      outcome: outcomeChoice,
      at: new Date().toISOString(),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    handleClose();
  }

  function submitScheduleFollowup() {
    if (!card) return;
    if (!nextFollowUpDate) {
      setError("Pick a follow-up date.");
      return;
    }
    const result = store.logCommunication({
      placementId: card.placementId,
      subjectType: card.contactWho,
      channel: "email",
      direction: "outbound",
      summary: summary.trim() || "Scheduled a follow-up.",
      owner,
      nextFollowUpDate,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    handleClose();
  }

  const title =
    card.recommendedAction === "log_outcome"
      ? "Log outcome"
      : card.recommendedAction === "record_feedback"
        ? "Record feedback"
        : card.recommendedAction === "create_issue"
          ? "Create issue"
          : card.recommendedAction === "schedule_followup"
            ? "Schedule follow-up"
            : card.recommendedAction === "escalate"
              ? "Escalate"
              : "Confirm fix held";

  if (card.recommendedAction === "confirm_fix") {
    return (
      <BottomSheet open={!!card} onClose={handleClose} title={title}>
        <div className="space-y-4">
          <p className="text-sm text-foreground/60">
            {card.clientName} · {card.professionalName}
          </p>
          <p className="text-sm">{card.reason}</p>
          {error && <p className="text-sm text-risk-critical">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" fullWidth onClick={() => submitConfirmFix("recurred")}>
              It recurred
            </Button>
            <Button variant="primary" fullWidth onClick={() => submitConfirmFix("held")}>
              Fix held
            </Button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet open={!!card} onClose={handleClose} title={title}>
      <div className="space-y-3">
        <p className="text-sm text-foreground/60">
          {card.clientName} · {card.professionalName}
        </p>

        {(card.recommendedAction === "log_outcome") && (
          <div className="flex gap-2">
            <button
              onClick={() => setOutcome("reached")}
              className={`tap-target flex-1 rounded-lg border px-3 text-sm ${outcome === "reached" ? "border-accent bg-accent-bg" : "border-border"}`}
            >
              Reached
            </button>
            <button
              onClick={() => setOutcome("no_answer")}
              className={`tap-target flex-1 rounded-lg border px-3 text-sm ${outcome === "no_answer" ? "border-accent bg-accent-bg" : "border-border"}`}
            >
              No answer
            </button>
          </div>
        )}

        {(card.recommendedAction === "log_outcome" || card.recommendedAction === "record_feedback") && (
          <div>
            <label className="text-xs font-medium text-foreground/70">Sentiment</label>
            <div className="mt-1 flex gap-2">
              {(["positive", "neutral", "negative"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSentiment(s)}
                  className={`tap-target flex-1 rounded-lg border px-2 text-xs capitalize ${sentiment === s ? "border-accent bg-accent-bg" : "border-border"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-foreground/70">Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-border p-2 text-sm"
            placeholder="What happened / what's the issue?"
          />
        </div>

        {card.recommendedAction === "log_outcome" && (
          <div>
            <label className="text-xs font-medium text-foreground/70">Commitment (optional)</label>
            <input
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border p-2 text-sm"
              placeholder="What did they commit to?"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-foreground/70">Owner</label>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border p-2 text-sm"
          />
        </div>

        {(card.recommendedAction === "log_outcome" || card.recommendedAction === "schedule_followup") && (
          <div>
            <label className="text-xs font-medium text-foreground/70">Next follow-up date</label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border p-2 text-sm"
            />
          </div>
        )}

        {card.recommendedAction === "log_outcome" && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={createIssueToggle} onChange={(e) => setCreateIssueToggle(e.target.checked)} />
              Create issue from this
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={escalateToggle} onChange={(e) => setEscalateToggle(e.target.checked)} />
              Escalate
            </label>
          </div>
        )}

        {error && <p className="text-sm text-risk-critical">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" fullWidth onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              if (card.recommendedAction === "log_outcome") submitLogOutcome();
              else if (card.recommendedAction === "record_feedback") submitRecordFeedback();
              else if (card.recommendedAction === "create_issue") submitCreateIssue();
              else if (card.recommendedAction === "schedule_followup") submitScheduleFollowup();
              else if (card.recommendedAction === "escalate") submitEscalate();
              else handleClose();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
