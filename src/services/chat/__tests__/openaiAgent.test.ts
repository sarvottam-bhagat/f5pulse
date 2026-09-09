import { describe, expect, it } from "vitest";
import { runOpenAIAgent } from "../openaiAgent";

describe("runOpenAIAgent", () => {
  it("uses the Responses API without OpenAI-side storage", async () => {
    let request: Record<string, unknown> | undefined;

    const output = await runOpenAIAgent({
      createResponse: async (value) => {
        request = value as unknown as Record<string, unknown>;
        return { output_text: "The placement is critical because an escalation is open." };
      },
      model: "gpt-5.6-terra",
      instructions: "system",
      input: [{ role: "user", content: "Why critical?" }],
    });

    expect(output).toBe("The placement is critical because an escalation is open.");
    expect(request).toMatchObject({
      model: "gpt-5.6-terra",
      store: false,
      reasoning: { effort: "low" },
      max_output_tokens: 1200,
      instructions: "system",
      input: [{ role: "user", content: "Why critical?" }],
    });
  });

  it("rejects an empty model response", async () => {
    await expect(
      runOpenAIAgent({
        createResponse: async () => ({ output_text: "  " }),
        model: "gpt-5.6-terra",
        instructions: "system",
        input: "question",
      }),
    ).rejects.toThrow("The agent returned an empty response.");
  });

  it("requires a server API key when using the real client", async () => {
    await expect(
      runOpenAIAgent({
        env: {},
        model: "gpt-5.6-terra",
        instructions: "system",
        input: "question",
      }),
    ).rejects.toThrow("The AI assistant is not configured.");
  });
});
