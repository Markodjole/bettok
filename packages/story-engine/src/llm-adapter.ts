import { z } from "zod";
import { isFeatureEnabled, LlmValidationError } from "@bettok/core";

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export interface LlmAdapter {
  generate(messages: LlmMessage[]): Promise<LlmResponse>;
}

class MockLlmAdapter implements LlmAdapter {
  async generate(messages: LlmMessage[]): Promise<LlmResponse> {
    const userMessage = messages.find((m) => m.role === "user")?.content || "";
    await new Promise((r) => setTimeout(r, 200));

    return {
      content: JSON.stringify({ mock: true, prompt_length: userMessage.length }),
      inputTokens: userMessage.length,
      outputTokens: 100,
      latencyMs: 200,
    };
  }
}

let _adapter: LlmAdapter | null = null;

export function getLlmAdapter(): LlmAdapter {
  if (_adapter) return _adapter;

  if (!isFeatureEnabled("ENABLE_REAL_LLM")) {
    _adapter = new MockLlmAdapter();
    return _adapter;
  }

  _adapter = new MockLlmAdapter();
  return _adapter;
}

export function setLlmAdapter(adapter: LlmAdapter): void {
  _adapter = adapter;
}

export async function generateAndValidate<T>(
  messages: LlmMessage[],
  schema: z.ZodType<T>,
  purpose: string
): Promise<{ data: T; response: LlmResponse }> {
  const adapter = getLlmAdapter();
  const response = await adapter.generate(messages);

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.content);
  } catch {
    throw new LlmValidationError(purpose, ["Failed to parse JSON output"]);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new LlmValidationError(
      purpose,
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`)
    );
  }

  return { data: result.data, response };
}
