"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField, SelectField, TextAreaField } from "@/components/ui/FormField";
import type { NewPlacementInput } from "@/store/types";
import { addDays, getDemoToday } from "@/domain/dates";
import { TRIAL_LENGTH_DAYS } from "@/domain/cadence";

export function Step3Placement({
  clientLabel,
  professionalLabel,
  roleTitleDefault,
  initial,
  onBack,
  onSubmit,
  submitting,
  submitError,
}: {
  clientLabel: string;
  professionalLabel: string;
  roleTitleDefault: string;
  initial: NewPlacementInput | null;
  onBack: () => void;
  onSubmit: (input: NewPlacementInput) => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const today = getDemoToday();
  const [form, setForm] = useState<NewPlacementInput>(
    initial ?? {
      roleTitle: roleTitleDefault,
      startDate: today,
      trialEndDate: addDays(today, TRIAL_LENGTH_DAYS),
      f5Owner: "",
      expectedSchedule: "",
      initialNotes: "",
      status: "Active",
    },
  );
  const [error, setError] = useState<string | null>(null);

  function handleStartDateChange(startDate: string) {
    setForm({ ...form, startDate, trialEndDate: addDays(startDate, TRIAL_LENGTH_DAYS) });
  }

  function handleSubmit() {
    if (!form.roleTitle.trim() || !form.f5Owner.trim() || !form.expectedSchedule.trim()) {
      setError("Role title, F5 owner, and expected schedule are required.");
      return;
    }
    onSubmit(form);
  }

  return (
    <div className="flex flex-1 flex-col p-4 space-y-4">
      <div>
        <p className="text-xs font-medium text-accent">Step 3 of 3</p>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Placement</h2>
        <p className="text-sm text-text-muted">
          {clientLabel} · {professionalLabel}
        </p>
      </div>

      <div className="space-y-3">
        <TextField label="Role title" value={form.roleTitle} onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
          />
          <TextField label="Trial-end date" type="date" value={form.trialEndDate} readOnly />
        </div>
        <TextField label="F5 owner" value={form.f5Owner} onChange={(e) => setForm({ ...form, f5Owner: e.target.value })} />
        <TextField
          label="Expected working schedule"
          placeholder="e.g. Mon-Fri, 9-5 EST"
          value={form.expectedSchedule}
          onChange={(e) => setForm({ ...form, expectedSchedule: e.target.value })}
        />
        <TextAreaField
          label="Initial notes"
          rows={3}
          value={form.initialNotes}
          onChange={(e) => setForm({ ...form, initialNotes: e.target.value })}
        />
        <SelectField
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as "Upcoming" | "Active" })}
        >
          <option value="Active">Active</option>
          <option value="Upcoming">Upcoming</option>
        </SelectField>
      </div>

      {(error || submitError) && <p className="text-sm text-risk-critical">{error || submitError}</p>}

      <div className="flex-1" />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button variant="primary" fullWidth onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Creating…" : "Create placement"}
        </Button>
      </div>
    </div>
  );
}
