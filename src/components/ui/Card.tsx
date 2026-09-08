import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[28px] bg-surface-secondary p-4 ${className}`}
      {...props}
    />
  );
}
