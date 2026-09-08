"use client";

export type CapabilityKey =
  | "summarize"
  | "explain_risk"
  | "talking_points"
  | "compare_complaints"
  | "recommend_escalation"
  | "draft_feedback_request"
  | "draft_complaint_response"
  | "draft_coaching_email"
  | "improvement_plan"
  | "recommend_resolutions"
  | "required_followups";

const CAPABILITIES: { key: CapabilityKey; label: string }[] = [
  { key: "summarize", label: "Summarize placement" },
  { key: "explain_risk", label: "Why is this at risk?" },
  { key: "talking_points", label: "Call talking points" },
  { key: "compare_complaints", label: "Compare complaints vs attendance" },
  { key: "recommend_escalation", label: "Recommend escalation?" },
  { key: "draft_feedback_request", label: "Draft feedback request" },
  { key: "draft_complaint_response", label: "Draft complaint response" },
  { key: "draft_coaching_email", label: "Draft coaching email" },
  { key: "improvement_plan", label: "Create improvement plan" },
  { key: "recommend_resolutions", label: "Recommend issue resolutions" },
  { key: "required_followups", label: "What follow-ups are needed?" },
];

export function CapabilityBar({ onSelect, disabled }: { onSelect: (key: CapabilityKey) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-2 overflow-x-auto px-3 pb-2 pt-1 scrollbar-none">
      {CAPABILITIES.map((c) => (
        <button
          key={c.key}
          onClick={() => onSelect(c.key)}
          disabled={disabled}
          className="tap-target shrink-0 rounded-full bg-surface-secondary px-3.5 text-xs font-medium whitespace-nowrap disabled:opacity-50"
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
