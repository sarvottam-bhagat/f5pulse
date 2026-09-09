import { describe, expect, it } from "vitest";
import { runOpenAIAgent } from "../openaiAgent";

describe("runOpenAIAgent", () => {
  it("forwards Responses API text deltas while building the final answer", async () => {
    const received: string[] = [];
    let request: Record<string, unknown> | undefined;

    async function* events() {
      yield { type: "response.created" };
      yield { type: "response.output_text.delta", delta: "Hello" };
      yield { type: "response.output_text.delta", delta: " world" };
      yield { type: "response.completed" };
    }

    const output = await runOpenAIAgent({
      createResponse: async () => ({ output_text: "non-streaming fallback" }),
      createStream: async (value) => {
        request = value as unknown as Record<string, unknown>;
        return events();
      },
      onTextDelta: (delta) => { received.push(delta); },
      model: "gpt-5.6-terra",
      instructions: "system",
      input: "question",
    });

    expect(received).toEqual(["Hello", " world"]);
    expect(output).toBe("Hello world");
    expect(request).toMatchObject({ stream: true, store: false });
  });

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
