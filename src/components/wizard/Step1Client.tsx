"use client";

import { useState } from "react";
import type { Client, USTimeZone, PreferredChannel } from "@/domain/types";
import { Button } from "@/components/ui/Button";
import { TextField, SelectField, TextAreaField } from "@/components/ui/FormField";
import type { NewClientInput } from "@/store/types";

const US_TIMEZONES: USTimeZone[] = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Phoenix",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];
const CHANNELS: PreferredChannel[] = ["email", "phone", "slack", "video"];

export type ClientSelection =
  | { mode: "existing"; clientId: string }
  | { mode: "new"; data: NewClientInput };

export function Step1Client({
  clients,
  initial,
  onNext,
}: {
  clients: Client[];
  initial: ClientSelection | null;
  onNext: (selection: ClientSelection) => void;
}) {
  const [mode, setMode] = useState<"existing" | "new">(initial?.mode ?? (clients.length > 0 ? "existing" : "new"));
  const [clientId, setClientId] = useState(initial?.mode === "existing" ? initial.clientId : clients[0]?.id ?? "");
  const [form, setForm] = useState<NewClientInput>(
    initial?.mode === "new"
      ? initial.data
      : {
          companyName: "",
          industry: "",
          primaryContactName: "",
          contactTitle: "",
          email: "",
          phone: "",
          usTimeZone: "America/New_York",
          preferredChannel: "email",
          notes: "",
        },
  );
  const [error, setError] = useState<string | null>(null);

  function handleNext() {
    if (mode === "existing") {
      if (!clientId) {
        setError("Select a client to continue.");
        return;
      }
      onNext({ mode: "existing", clientId });
      return;
    }
    if (!form.companyName.trim() || !form.primaryContactName.trim() || !form.email.trim()) {
      setError("Company name, contact name, and email are required.");
      return;
    }
    onNext({ mode: "new", data: form });
  }

  return (
    <div className="flex flex-1 flex-col p-4 space-y-4">
      <div>
        <p className="text-xs font-medium text-accent">Step 1 of 3</p>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">US Client</h2>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode("existing")}
          className={`tap-target flex-1 rounded-full text-sm font-medium ${mode === "existing" ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary"}`}
          disabled={clients.length === 0}
        >
          Existing client
        </button>
        <button
          onClick={() => setMode("new")}
          className={`tap-target flex-1 rounded-full text-sm font-medium ${mode === "new" ? "bg-[#1d1d1f] text-white" : "bg-surface-secondary"}`}
        >
          New client
        </button>
      </div>

      {mode === "existing" ? (
        <SelectField label="Client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
          <option value="" disabled>
            Select a client
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.companyName}
            </option>
          ))}
        </SelectField>
      ) : (
        <div className="space-y-3">
          <TextField
            label="Company name"
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
          <TextField
            label="Industry"
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
          />
          <TextField
            label="Primary contact name"
            value={form.primaryContactName}
            onChange={(e) => setForm({ ...form, primaryContactName: e.target.value })}
          />
          <TextField
            label="Contact title"
            value={form.contactTitle}
            onChange={(e) => setForm({ ...form, contactTitle: e.target.value })}
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <SelectField
            label="US time zone"
            value={form.usTimeZone}
            onChange={(e) => setForm({ ...form, usTimeZone: e.target.value as USTimeZone })}
          >
            {US_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Preferred communication channel"
            value={form.preferredChannel}
            onChange={(e) => setForm({ ...form, preferredChannel: e.target.value as PreferredChannel })}
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectField>
          <TextAreaField
            label="Notes"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      )}

      {error && <p className="text-sm text-risk-critical">{error}</p>}

      <div className="flex-1" />
      <Button variant="primary" fullWidth onClick={handleNext}>
        Continue
      </Button>
    </div>
  );
}
