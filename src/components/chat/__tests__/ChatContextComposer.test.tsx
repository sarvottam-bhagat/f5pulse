// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Seed } from "@/domain/types";
import { seedWithClientAndProfessional } from "@/store/__tests__/fixtures";
import { ChatContextComposer } from "../ChatContextComposer";

function seedWithActivePlacement(): Seed {
  const seed = seedWithClientAndProfessional();
  return {
    ...seed,
    placements: [{
      id: "placement_1",
      clientId: "client_1",
      professionalId: "pro_1",
      roleTitle: "Customer Support Specialist",
      startDate: "2026-01-01",
      trialEndDate: "2026-01-31",
      f5Owner: "Jamie Ortiz",
      expectedSchedule: "Mon-Fri",
      initialNotes: "",
      status: "Active",
      archived: false,
      createdAt: "2026-01-01",
    }],
  };
}

describe("ChatContextComposer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  async function type(value: string) {
    const textarea = container.querySelector<HTMLTextAreaElement>('textarea[aria-label="Message"]')!;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      setter?.call(textarea, value);
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  it("opens a searchable client menu when @ is typed and selects the client", async () => {
    const onSelectClient = vi.fn();
    await act(async () => root.render(
      <ChatContextComposer
        seed={seedWithActivePlacement()}
        context={null}
        selectedClientId={null}
        onSelectClient={onSelectClient}
        onAttachContext={() => undefined}
        onClearClient={() => undefined}
        onClearProfessional={() => undefined}
        onSend={() => undefined}
      />,
    ));

    await type("Ask @acme");
    const option = container.querySelector<HTMLButtonElement>('[role="option"]')!;
    expect(option.textContent).toContain("Acme Co");

    await act(async () => option.click());
    expect(onSelectClient).toHaveBeenCalledWith("client_1");
    expect(container.querySelector<HTMLTextAreaElement>("textarea")?.value).toBe("Ask ");
  });

  it("shows only the selected client's active professionals for / and attaches their placement", async () => {
    const onAttachContext = vi.fn();
    await act(async () => root.render(
      <ChatContextComposer
        seed={seedWithActivePlacement()}
        context={null}
        selectedClientId="client_1"
        onSelectClient={() => undefined}
        onAttachContext={onAttachContext}
        onClearClient={() => undefined}
        onClearProfessional={() => undefined}
        onSend={() => undefined}
      />,
    ));

    await type("/alex");
    const option = container.querySelector<HTMLButtonElement>('[role="option"]')!;
    expect(option.textContent).toContain("Alex Rivera");

    await act(async () => option.click());
    expect(onAttachContext).toHaveBeenCalledWith({
      placementId: "placement_1",
      clientId: "client_1",
      professionalId: "pro_1",
    });
  });

  it("explains that a client must be selected before / can list professionals", async () => {
    await act(async () => root.render(
      <ChatContextComposer
        seed={seedWithActivePlacement()}
        context={null}
        selectedClientId={null}
        onSelectClient={() => undefined}
        onAttachContext={() => undefined}
        onClearClient={() => undefined}
        onClearProfessional={() => undefined}
        onSend={() => undefined}
      />,
    ));

    await type("/");
    expect(container.textContent).toContain("Select a client with @ first");
    expect(container.textContent).not.toContain("Alex Rivera");
  });
});
