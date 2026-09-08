import type { ReactNode } from "react";

type BannerTone = "warning" | "error" | "info";

const TONE_CLASSES: Record<BannerTone, string> = {
  warning: "bg-risk-medium-bg text-risk-medium border-risk-medium/30",
  error: "bg-risk-critical-bg text-risk-critical border-risk-critical/30",
  info: "bg-accent-bg text-accent border-accent/30",
};

export function Banner({
  tone = "info",
  children,
  action,
}: {
  tone?: BannerTone;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${TONE_CLASSES[tone]}`}>
      <span>{children}</span>
      {action}
    </div>
  );
}

export function StaleDataBanner({ lastSuccessfulAt, onRetry }: { lastSuccessfulAt?: string; onRetry?: () => void }) {
  return (
    <Banner tone="warning" action={onRetry && <button onClick={onRetry} className="underline font-medium">Retry</button>}>
      Showing the last successful queue{lastSuccessfulAt ? ` (as of ${lastSuccessfulAt})` : ""}. New data could not be loaded.
    </Banner>
  );
}

export function StorageFailureBanner() {
  return (
    <Banner tone="warning">
      Browser storage is unavailable. Changes will not be saved after you close this tab (temporary mode).
    </Banner>
  );
}

export function MalformedRecordBanner({ count }: { count: number }) {
  return (
    <Banner tone="error">
      {count} record{count === 1 ? "" : "s"} in the seed data could not be read and {count === 1 ? "was" : "were"} skipped.
    </Banner>
  );
}
