// @vitest-environment jsdom
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { hydrateRoot, type Root } from "react-dom/client";
import { loadOriginalSeed } from "../seedData";
import { useStoreData } from "../useStore";

function ProfessionalCount() {
  const { seed } = useStoreData();
  return <span>{seed.professionals.length}</span>;
}

let root: Root | null = null;

afterEach(async () => {
  if (root) {
    await act(async () => root?.unmount());
    root = null;
  }
  window.localStorage.clear();
});

describe("useStoreData hydration", () => {
  it("hydrates with the server seed before revealing newer localStorage data", async () => {
    const original = loadOriginalSeed();
    const persisted = {
      ...original,
      professionals: [
        ...original.professionals,
        { ...original.professionals[0], id: "professional_added_in_browser" },
      ],
    };
    window.localStorage.setItem(
      "f5pulse:store:v1",
      JSON.stringify({ version: 1, data: persisted }),
    );

    const container = document.createElement("div");
    container.innerHTML = `<span>${original.professionals.length}</span>`;
    document.body.appendChild(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await act(async () => {
      root = hydrateRoot(container, <ProfessionalCount />);
    });

    expect(container.textContent).toBe(String(original.professionals.length + 1));
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("Hydration failed");

    consoleError.mockRestore();
    container.remove();
  });
});
