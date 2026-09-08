import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-[var(--color-accent-hover)] active:scale-[0.98] shadow-sm",
  secondary: "bg-surface-secondary text-foreground hover:brightness-95 active:scale-[0.98]",
  danger: "bg-risk-critical text-white hover:opacity-90 active:scale-[0.98] shadow-sm",
  ghost: "text-accent hover:bg-accent-bg active:scale-[0.98]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({ variant = "primary", fullWidth, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`tap-target inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium tracking-[-0.01em] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
