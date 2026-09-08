"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField } from "@/components/ui/FormField";
import { useStore } from "@/store/useStore";
import type { Sentiment, FeedbackSubjectType } from "@/domain/types";

export function LogOutcomeSheet({
  open,
  placementId,
  onClose,
}: {
  open: boolean;
  placementId: string;
  onClose: () => void;
}) {
  const store = useStore();
  const [subjectType, setSubjectType] = useState<FeedbackSubjectType>("client");
  const [outcome, setOutcome] = useState<"reached" | "no_answer">("reached");
  const [sentiment, setSentiment] = useState<Sentiment>("neutral");
  const [summary, setSummary] = useState("");
  const [commitment, setCommitment] = useState("");
  const [owner, setOwner] = useState("Jamie Ortiz");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [createIssueToggle, setCreateIssueToggle] = useState(false);
  const [escalateToggle, setEscalateToggle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setSubjectType("client");
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

  function handleSave() {
    if (!summary.trim()) {
      setError("Please add a short summary.");
      return;
    }
    const result = store.logOutcome({
      placementId,
      subjectType,
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

  return (
    <BottomSheet open={open} onClose={handleClose} title="Log outcome">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-text-muted">Who did you contact?</label>
          <div className="mt-1 flex gap-2">
            <button
              onClick={() => setSubjectType("client")}
              className={`tap-target flex-1 rounded-full text-sm ${subjectType === "client" ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary"}`}
            >
              Client
            </button>
            <button
              onClick={() => setSubjectType("professional")}
              className={`tap-target flex-1 rounded-full text-sm ${subjectType === "professional" ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary"}`}
            >
              Professional
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setOutcome("reached")}
            className={`tap-target flex-1 rounded-full text-sm ${outcome === "reached" ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary"}`}
          >
            Reached
          </button>
          <button
            onClick={() => setOutcome("no_answer")}
            className={`tap-target flex-1 rounded-full text-sm ${outcome === "no_answer" ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary"}`}
          >
            No answer
          </button>
        </div>

        <div>
          <label className="text-xs font-medium text-text-muted">Sentiment</label>
          <div className="mt-1 flex gap-2">
            {(["positive", "neutral", "negative"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSentiment(s)}
                className={`tap-target flex-1 rounded-full text-xs capitalize ${sentiment === s ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <TextAreaField label="Summary" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
        <TextField label="Commitment (optional)" value={commitment} onChange={(e) => setCommitment(e.target.value)} />
        <TextField label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <TextField
          label="Next follow-up date"
          type="date"
          value={nextFollowUpDate}
          onChange={(e) => setNextFollowUpDate(e.target.value)}
        />

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

        {error && <p className="text-sm text-risk-critical">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" fullWidth onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
