"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function BackHeader({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: ReactNode }) {
  return (
    <div className="px-4 pt-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.02em] truncate">{title}</h1>
          {subtitle && <p className="text-sm text-text-muted truncate">{subtitle}</p>}
        </div>
        {badge}
      </div>
    </div>
  );
}

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="tap-target flex items-center gap-1 px-2 text-sm font-medium text-accent"
    >
      ← Back
    </button>
  );
}
