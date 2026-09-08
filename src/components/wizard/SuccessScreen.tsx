import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatHuman } from "@/domain/dates";
import type { CreatePlacementBundleResult } from "@/store/types";

export function SuccessScreen({ result }: { result: CreatePlacementBundleResult }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
      <span className="text-4xl" aria-hidden>
        🎉
      </span>
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.02em]">Placement created</h2>
        <p className="text-sm text-text-muted mt-1">
          {result.client.companyName} × {result.professional.fullName}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-2 rounded-[20px] bg-surface-secondary p-4 text-left text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Role</span>
          <span className="font-medium">{result.placement.roleTitle}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">Start date</span>
          <span className="font-medium">{formatHuman(result.placement.startDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">First client contact</span>
          <span className="font-medium">{formatHuman(result.firstClientContactDate)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-muted">First professional check-in</span>
          <span className="font-medium">{formatHuman(result.firstProfessionalCheckinDate)}</span>
        </div>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-2">
        <Link href={`/placements/${result.placement.id}`}>
          <Button variant="primary" fullWidth>
            View Placement
          </Button>
        </Link>
        <Link href={`/chat?placementId=${result.placement.id}`}>
          <Button variant="secondary" fullWidth>
            Open in Chat
          </Button>
        </Link>
      </div>
    </div>
  );
}
