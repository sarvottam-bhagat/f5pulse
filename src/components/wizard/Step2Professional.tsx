"use client";

import { useState } from "react";
import type { Professional, ProfessionalRole } from "@/domain/types";
import { Button } from "@/components/ui/Button";
import { TextField, SelectField, TextAreaField } from "@/components/ui/FormField";
import type { NewProfessionalInput } from "@/store/types";

const ROLES: ProfessionalRole[] = [
  "Customer Support Specialist",
  "Executive Assistant",
  "Bookkeeper",
  "Software Developer",
  "Data Entry Specialist",
  "Sales Development Rep",
  "Marketing Coordinator",
  "HR Coordinator",
  "Recruiter",
  "Graphic Designer",
];

export type ProfessionalSelection =
  | { mode: "existing"; professionalId: string }
  | { mode: "new"; data: NewProfessionalInput };

export function Step2Professional({
  unassignedProfessionals,
  initial,
  onBack,
  onNext,
}: {
  unassignedProfessionals: Professional[];
  initial: ProfessionalSelection | null;
  onBack: () => void;
  onNext: (selection: ProfessionalSelection) => void;
}) {
  const [mode, setMode] = useState<"existing" | "new">(
    initial?.mode ?? (unassignedProfessionals.length > 0 ? "existing" : "new"),
  );
  const [professionalId, setProfessionalId] = useState(
    initial?.mode === "existing" ? initial.professionalId : unassignedProfessionals[0]?.id ?? "",
  );
  const [form, setForm] = useState<NewProfessionalInput>(
    initial?.mode === "new"
      ? initial.data
      : {
          fullName: "",
          role: "Customer Support Specialist",
          email: "",
          phone: "",
          country: "",
          timeZone: "",
          workingHours: { start: "09:00", end: "17:00", timeZone: "" },
          f5Manager: "",
          notes: "",
        },
  );
  const [error, setError] = useState<string | null>(null);

  function handleNext() {
    if (mode === "existing") {
      if (!professionalId) {
        setError("Select a professional to continue.");
        return;
      }
      onNext({ mode: "existing", professionalId });
      return;
    }
    if (!form.fullName.trim() || !form.email.trim() || !form.country.trim()) {
      setError("Full name, email, and country are required.");
      return;
    }
    onNext({ mode: "new", data: { ...form, workingHours: { ...form.workingHours, timeZone: form.timeZone } } });
  }

  return (
    <div className="flex flex-1 flex-col p-4 space-y-4">
      <div>
        <p className="text-xs font-medium text-accent">Step 2 of 3</p>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Professional</h2>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode("existing")}
          className={`tap-target flex-1 rounded-full text-sm font-medium ${mode === "existing" ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary"}`}
          disabled={unassignedProfessionals.length === 0}
        >
          Existing (unassigned)
        </button>
        <button
          onClick={() => setMode("new")}
          className={`tap-target flex-1 rounded-full text-sm font-medium ${mode === "new" ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary"}`}
        >
          New professional
        </button>
      </div>

      {mode === "existing" ? (
        unassignedProfessionals.length === 0 ? (
          <p className="text-sm text-text-muted">No unassigned professionals available. Create a new one instead.</p>
        ) : (
          <SelectField label="Professional" value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
            <option value="" disabled>
              Select a professional
            </option>
            {unassignedProfessionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName} — {p.role}
              </option>
            ))}
          </SelectField>
        )
      ) : (
        <div className="space-y-3">
          <TextField
            label="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <SelectField label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as ProfessionalRole })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </SelectField>
          <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <TextField
            label="Time zone (IANA)"
            placeholder="e.g. Asia/Manila"
            value={form.timeZone}
            onChange={(e) => setForm({ ...form, timeZone: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Working hours start"
              type="time"
              value={form.workingHours.start}
              onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, start: e.target.value } })}
            />
            <TextField
              label="Working hours end"
              type="time"
              value={form.workingHours.end}
              onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, end: e.target.value } })}
            />
          </div>
          <TextField label="F5 manager" value={form.f5Manager} onChange={(e) => setForm({ ...form, f5Manager: e.target.value })} />
          <TextAreaField label="Notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      )}

      {error && <p className="text-sm text-risk-critical">{error}</p>}

      <div className="flex-1" />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" fullWidth onClick={handleNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
