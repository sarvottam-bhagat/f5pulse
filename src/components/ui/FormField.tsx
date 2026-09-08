import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-xs font-medium text-text-muted">{children}</label>;
}

export function TextField({
  label,
  error,
  ...props
}: { label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <input
        {...props}
        className="tap-target w-full rounded-2xl bg-surface-secondary px-3.5 text-sm outline-none focus:ring-2 focus:ring-accent"
      />
      {error && <p className="text-xs text-risk-critical">{error}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  ...props
}: { label: string; error?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        {...props}
        className="w-full rounded-2xl bg-surface-secondary p-3.5 text-sm outline-none focus:ring-2 focus:ring-accent"
      />
      {error && <p className="text-xs text-risk-critical">{error}</p>}
    </div>
  );
}

export function SelectField({
  label,
  error,
  children,
  ...props
}: { label: string; error?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1">
      <FieldLabel>{label}</FieldLabel>
      <select
        {...props}
        className="tap-target w-full rounded-2xl bg-surface-secondary px-3.5 text-sm outline-none focus:ring-2 focus:ring-accent"
      >
        {children}
      </select>
      {error && <p className="text-xs text-risk-critical">{error}</p>}
    </div>
  );
}
