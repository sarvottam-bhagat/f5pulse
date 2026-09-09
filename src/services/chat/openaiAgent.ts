import OpenAI from "openai";
import type {
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
} from "openai/resources/responses/responses";

const DEFAULT_MODEL = "gpt-5.6-terra";

type CreateResponse = (
  request: ResponseCreateParamsNonStreaming,
) => Promise<{ output_text?: string | null }>;

interface TextStreamEvent {
  type: string;
  delta?: string;
}

type CreateStream = (
  request: ResponseCreateParamsStreaming,
) => Promise<AsyncIterable<TextStreamEvent>>;

export interface RunOpenAIAgentOptions {
  instructions: string;
  input: ResponseCreateParamsNonStreaming["input"];
  model?: string;
  apiKey?: string;
  env?: Record<string, string | undefined>;
  createResponse?: CreateResponse;
  createStream?: CreateStream;
  onTextDelta?: (delta: string) => void | Promise<void>;
}

export async function runOpenAIAgent({
  instructions,
  input,
  model,
  apiKey,
  env = process.env,
  createResponse,
  createStream,
  onTextDelta,
}: RunOpenAIAgentOptions): Promise<string> {
  const resolvedModel = model?.trim() || env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  let create = createResponse;
  let stream = createStream;

  if (!create || (onTextDelta && !stream)) {
    const resolvedApiKey = apiKey?.trim() || env.OPENAI_API_KEY?.trim();
    if (!resolvedApiKey) {
      throw new Error("The AI assistant is not configured.");
    }
    const client = new OpenAI({ apiKey: resolvedApiKey });
    create ??= (request) => client.responses.create(request);
    stream ??= (request) => client.responses.create(request) as unknown as Promise<AsyncIterable<TextStreamEvent>>;
  }

  if (onTextDelta && stream) {
    const responseStream = await stream({
      model: resolvedModel,
      instructions,
      input,
      reasoning: { effort: "low" },
      max_output_tokens: 1200,
      store: false,
      stream: true,
    });
    let output = "";
    for await (const event of responseStream) {
      if (event.type !== "response.output_text.delta" || !event.delta) continue;
      output += event.delta;
      await onTextDelta(event.delta);
    }
    const text = output.trim();
    if (!text) throw new Error("The agent returned an empty response.");
    return text;
  }

  const response = await create!({
    model: resolvedModel,
    instructions,
    input,
    reasoning: { effort: "low" },
    max_output_tokens: 1200,
    store: false,
  });
  const text = response.output_text?.trim();
  if (!text) {
    throw new Error("The agent returned an empty response.");
  }
  return text;
}
