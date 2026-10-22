import { describe, expect, it, vi } from "vitest";
import { complete, LlmError, llmConfigFromEnv } from "./llm";

const config = { baseUrl: "https://llm.test/v1", apiKey: "k", model: "m", timeoutMs: 1000 };
const msgs = [{ role: "user" as const, content: "hola" }];
const opts = { maxTokens: 50, temperature: 0.5 };

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("llmConfigFromEnv", () => {
  it("exige la API key", () => {
    expect(() => llmConfigFromEnv({})).toThrow(LlmError);
  });
  it("usa defaults y limpia la barra final", () => {
    const c = llmConfigFromEnv({ LLM_API_KEY: "x", LLM_BASE_URL: "https://api.groq.com/openai/v1/" });
    expect(c.baseUrl).toBe("https://api.groq.com/openai/v1");
    expect(c.model).toBe("gpt-4.1-mini");
  });
});

describe("complete", () => {
  it("manda el request con formato OpenAI y devuelve el texto", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ choices: [{ message: { content: "  Mirá, muchacho.  " } }] })
    );
    const out = await complete(msgs, opts, config, fetchMock);
    expect(out).toBe("Mirá, muchacho.");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://llm.test/v1/chat/completions");
    expect(init.headers.Authorization).toBe("Bearer k");
    expect(JSON.parse(init.body)).toMatchObject({ model: "m", max_tokens: 50, messages: msgs });
  });

  it("tira LlmError http ante un status de error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 }));
    await expect(complete(msgs, opts, config, fetchMock)).rejects.toMatchObject({ kind: "http" });
  });

  it("tira LlmError empty si no hay contenido", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ choices: [] }));
    await expect(complete(msgs, opts, config, fetchMock)).rejects.toMatchObject({ kind: "empty" });
  });

  it("tira LlmError timeout", async () => {
    const err = new Error("t");
    err.name = "TimeoutError";
    const fetchMock = vi.fn().mockRejectedValue(err);
    await expect(complete(msgs, opts, config, fetchMock)).rejects.toMatchObject({ kind: "timeout" });
  });
});
