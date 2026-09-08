"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { WizardProgress } from "@/components/wizard/WizardProgress";
import { Step1Client, type ClientSelection } from "@/components/wizard/Step1Client";
import { Step2Professional, type ProfessionalSelection } from "@/components/wizard/Step2Professional";
import { Step3Placement } from "@/components/wizard/Step3Placement";
import { SuccessScreen } from "@/components/wizard/SuccessScreen";
import { useStore, useStoreData } from "@/store/useStore";
import type { CreatePlacementBundleResult, NewPlacementInput } from "@/store/types";

type WizardStep = 1 | 2 | 3;

export default function AddPlacementPage() {
  const router = useRouter();
  const store = useStore();
  const { seed } = useStoreData();

  const [step, setStep] = useState<WizardStep>(1);
  const [clientSelection, setClientSelection] = useState<ClientSelection | null>(null);
  const [professionalSelection, setProfessionalSelection] = useState<ProfessionalSelection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatePlacementBundleResult | null>(null);

  const activeClients = useMemo(() => seed.clients.filter((c) => !c.archived), [seed.clients]);
  const unassignedProfessionals = useMemo(() => {
    const assignedIds = new Set(
      seed.placements.filter((p) => p.status === "Active" && !p.archived).map((p) => p.professionalId),
    );
    return seed.professionals.filter((p) => !p.archived && !assignedIds.has(p.id));
  }, [seed.professionals, seed.placements]);

  function handleCancel() {
    router.push("/");
  }

  function handleSubmit(placementInput: NewPlacementInput) {
    if (!clientSelection || !professionalSelection) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = store.createPlacementBundle({
      client: clientSelection,
      professional: professionalSelection,
      placement: placementInput,
    });
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(res.error);
      return;
    }
    setResult(res.value);
  }

  const clientLabel =
    clientSelection?.mode === "existing"
      ? activeClients.find((c) => c.id === clientSelection.clientId)?.companyName ?? "Client"
      : clientSelection?.data.companyName ?? "New client";

  const professionalLabel =
    professionalSelection?.mode === "existing"
      ? unassignedProfessionals.find((p) => p.id === professionalSelection.professionalId)?.fullName ?? "Professional"
      : professionalSelection?.data.fullName ?? "New professional";

  const roleTitleDefault =
    professionalSelection?.mode === "existing"
      ? unassignedProfessionals.find((p) => p.id === professionalSelection.professionalId)?.role ?? ""
      : professionalSelection?.data.role ?? "";

  if (result) {
    return (
      <div className="flex flex-1 flex-col">
        <TopBar title="Add Placement" />
        <SuccessScreen result={result} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="Add Placement" />
      <WizardProgress step={step} total={3} />

      {step === 1 && (
        <Step1Client
          clients={activeClients}
          initial={clientSelection}
          onNext={(selection) => {
            setClientSelection(selection);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <Step2Professional
          unassignedProfessionals={unassignedProfessionals}
          initial={professionalSelection}
          onBack={() => setStep(1)}
          onNext={(selection) => {
            setProfessionalSelection(selection);
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <Step3Placement
          clientLabel={clientLabel}
          professionalLabel={professionalLabel}
          roleTitleDefault={roleTitleDefault}
          initial={null}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
          submitting={submitting}
          submitError={submitError}
        />
      )}

      <div className="p-4 pt-0">
        <button onClick={handleCancel} className="tap-target w-full text-center text-sm text-text-muted">
          Cancel
        </button>
      </div>
    </div>
  );
}
