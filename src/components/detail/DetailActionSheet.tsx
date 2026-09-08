"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField } from "@/components/ui/FormField";
import { useStore } from "@/store/useStore";
import type { Sentiment, FeedbackSubjectType, IssueSeverity, EscalationReason, CommunicationChannel } from "@/domain/types";

export type DetailAction =
  | { kind: "record_feedback"; placementId: string; subjectType: FeedbackSubjectType }
  | { kind: "log_contact"; placementId: string; subjectType: FeedbackSubjectType }
  | { kind: "draft_email"; placementId: string; subjectType: FeedbackSubjectType }
  | { kind: "schedule_checkin"; placementId: string; subjectType: FeedbackSubjectType }
  | { kind: "open_issue"; placementId: string; subjectType: FeedbackSubjectType }
  | { kind: "escalate"; placementId: string; subjectType: FeedbackSubjectType }
  | { kind: "record_attendance"; placementId: string; professionalId: string }
  | { kind: "coaching_note"; placementId: string }
  | { kind: "improvement_plan"; placementId: string };

const TITLES: Record<DetailAction["kind"], string> = {
  record_feedback: "Record feedback",
  log_contact: "Log contact",
  draft_email: "Draft email",
  schedule_checkin: "Schedule check-in",
  open_issue: "Open issue",
  escalate: "Escalate",
  record_attendance: "Record attendance event",
  coaching_note: "Add coaching note",
  improvement_plan: "Create improvement plan",
};

export function DetailActionSheet({ action, onClose }: { action: DetailAction | null; onClose: () => void }) {
  const store = useStore();
  const [summary, setSummary] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment>("neutral");
  const [owner, setOwner] = useState("Jamie Ortiz");
  const [dueDate, setDueDate] = useState("");
  const [channel, setChannel] = useState<CommunicationChannel>("email");
  const [severity, setSeverity] = useState<IssueSeverity>("medium");
  const [attendanceEvent, setAttendanceEvent] = useState<"late" | "absent_full_shift" | "absent_partial" | "early_departure">("late");
  const [error, setError] = useState<string | null>(null);

  if (!action) return null;

  function reset() {
    setSummary("");
    setSentiment("neutral");
    setDueDate("");
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  function requireSummary() {
    if (!summary.trim()) {
      setError("Please add a short summary.");
      return false;
    }
    return true;
  }

  function handleSave() {
    if (!action) return;
    switch (action.kind) {
      case "record_feedback": {
        if (!requireSummary()) return;
        const res = store.recordFeedback({
          placementId: action.placementId,
          subjectType: action.subjectType,
          sentiment,
          summary: summary.trim(),
          collectedAt: new Date().toISOString(),
        });
        if (!res.ok) return setError(res.error);
        break;
      }
      case "log_contact": {
        if (!requireSummary()) return;
        const res = store.logCommunication({
          placementId: action.placementId,
          subjectType: action.subjectType,
          channel,
          direction: "outbound",
          outcome: "reached",
          summary: summary.trim(),
          owner,
        });
        if (!res.ok) return setError(res.error);
        break;
      }
      case "draft_email": {
        if (!requireSummary()) return;
        const res = store.logCommunication({
          placementId: action.placementId,
          subjectType: action.subjectType,
          channel: "email",
          direction: "outbound",
          summary: "Drafted email (not yet sent).",
          owner,
          draftBody: summary.trim(),
        });
        if (!res.ok) return setError(res.error);
        break;
      }
      case "schedule_checkin": {
        if (!dueDate) return setError("Pick a date for the check-in.");
        const res = store.logCommunication({
          placementId: action.placementId,
          subjectType: action.subjectType,
          channel: "email",
          direction: "outbound",
          summary: summary.trim() || "Scheduled a check-in.",
          owner,
          nextFollowUpDate: dueDate,
        });
        if (!res.ok) return setError(res.error);
        break;
      }
      case "open_issue": {
        if (!requireSummary()) return;
        const res = store.createIssue({
          placementId: action.placementId,
          title: summary.trim().slice(0, 80),
          description: summary.trim(),
          source: action.subjectType === "client" ? "client_complaint" : "performance",
          severity,
          owner,
        });
        if (!res.ok) return setError(res.error);
        break;
      }
      case "escalate": {
        if (!requireSummary()) return;
        const reason: EscalationReason =
          action.subjectType === "client" ? "cancellation_or_replacement_mentioned" : "full_shift_absence_no_contact";
        const res = store.createEscalation({ placementId: action.placementId, reason, summary: summary.trim() });
        if (!res.ok) return setError(res.error);
        break;
      }
      case "record_attendance": {
        if (!dueDate) return setError("Pick the date of the attendance event.");
        const res = store.recordAttendance({
          placementId: action.placementId,
          professionalId: action.professionalId,
          date: dueDate,
          eventType: attendanceEvent,
          notifiedInAdvance: false,
          notes: summary.trim() || undefined,
        });
        if (!res.ok) return setError(res.error);
        break;
      }
      case "coaching_note":
      case "improvement_plan": {
        if (!requireSummary()) return;
        const res = store.logCommunication({
          placementId: action.placementId,
          subjectType: "professional",
          channel: "email",
          direction: "outbound",
          summary: `${action.kind === "coaching_note" ? "Coaching note" : "Improvement plan"}: ${summary.trim()}`,
          owner,
        });
        if (!res.ok) return setError(res.error);
        break;
      }
    }
    close();
  }

  return (
    <BottomSheet open={!!action} onClose={close} title={TITLES[action.kind]}>
      <div className="space-y-3">
        {(action.kind === "record_feedback") && (
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
        )}

        {action.kind === "log_contact" && (
          <SelectField label="Channel" value={channel} onChange={(e) => setChannel(e.target.value as CommunicationChannel)}>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="slack">Slack</option>
            <option value="video">Video</option>
          </SelectField>
        )}

        {action.kind === "open_issue" && (
          <SelectField label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value as IssueSeverity)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </SelectField>
        )}

        {action.kind === "record_attendance" && (
          <>
            <SelectField
              label="Event type"
              value={attendanceEvent}
              onChange={(e) => setAttendanceEvent(e.target.value as typeof attendanceEvent)}
            >
              <option value="late">Late</option>
              <option value="absent_full_shift">Absent (full shift)</option>
              <option value="absent_partial">Absent (partial)</option>
              <option value="early_departure">Early departure</option>
            </SelectField>
            <TextField label="Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </>
        )}

        {action.kind === "schedule_checkin" && (
          <TextField label="Check-in date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        )}

        <TextAreaField
          label={action.kind === "draft_email" ? "Email body" : "Summary"}
          rows={action.kind === "draft_email" ? 5 : 3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />

        {(action.kind === "log_contact" ||
          action.kind === "draft_email" ||
          action.kind === "schedule_checkin" ||
          action.kind === "open_issue") && (
          <TextField label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} />
        )}

        {error && <p className="text-sm text-risk-critical">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" fullWidth onClick={close}>
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
