// Adaptador mínimo para cualquier API compatible con OpenAI (/chat/completions):
// OpenAI, Groq, OpenRouter, DeepSeek, Together, Ollama, etc.

export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export interface CompleteOptions {
  maxTokens: number;
  temperature: number;
}

export type LlmErrorKind = "config" | "http" | "timeout" | "empty";

export class LlmError extends Error {
  constructor(message: string, readonly kind: LlmErrorKind) {
    super(message);
    this.name = "LlmError";
  }
}

export function llmConfigFromEnv(env: Record<string, string | undefined> = process.env): LlmConfig {
  const apiKey = env.LLM_API_KEY;
  if (!apiKey) throw new LlmError("Falta LLM_API_KEY en el .env", "config");
  return {
    baseUrl: (env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, ""),
    apiKey,
    model: env.LLM_MODEL || "gpt-4.1-mini",
    timeoutMs: Number(env.LLM_TIMEOUT_MS) || 20_000,
  };
}

export async function complete(
  messages: LlmMessage[],
  opts: CompleteOptions,
  config: LlmConfig = llmConfigFromEnv(),
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  let res: Response;
  try {
    res = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (err) {
    const name = (err as Error)?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      throw new LlmError(`El LLM no respondió en ${config.timeoutMs} ms`, "timeout");
    }
    throw new LlmError(`No se pudo conectar con el LLM: ${(err as Error)?.message}`, "http");
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new LlmError(`El LLM devolvió ${res.status}: ${detail}`, "http");
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new LlmError("El LLM devolvió una respuesta vacía", "empty");
  return text;
}
