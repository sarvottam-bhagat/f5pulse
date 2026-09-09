import OpenAI from "openai";
import type {
  ResponseCreateParamsNonStreaming,
} from "openai/resources/responses/responses";

const DEFAULT_MODEL = "gpt-5.6-terra";

type CreateResponse = (
  request: ResponseCreateParamsNonStreaming,
) => Promise<{ output_text?: string | null }>;

export interface RunOpenAIAgentOptions {
  instructions: string;
  input: ResponseCreateParamsNonStreaming["input"];
  model?: string;
  apiKey?: string;
  env?: Record<string, string | undefined>;
  createResponse?: CreateResponse;
}

export async function runOpenAIAgent({
  instructions,
  input,
  model,
  apiKey,
  env = process.env,
  createResponse,
}: RunOpenAIAgentOptions): Promise<string> {
  const resolvedModel = model?.trim() || env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
  let create = createResponse;

  if (!create) {
    const resolvedApiKey = apiKey?.trim() || env.OPENAI_API_KEY?.trim();
    if (!resolvedApiKey) {
      throw new Error("The AI assistant is not configured.");
    }
    const client = new OpenAI({ apiKey: resolvedApiKey });
    create = (request) => client.responses.create(request);
  }

  const response = await create({
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
