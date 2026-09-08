import type { ReactNode } from "react";

export function EmptyState({
  icon = "✅",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-10 text-center">
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-foreground/60">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function AllCaughtUpState() {
  return (
    <EmptyState
      icon="🎉"
      title="All caught up"
      description="No contacts due today, no escalations, and nothing waiting on confirmation."
    />
  );
}

export function NoSearchResultsState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={query ? `Nothing matched "${query}". Try a different search.` : "Try adjusting your filters."}
    />
  );
}
