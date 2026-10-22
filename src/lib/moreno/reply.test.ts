import { describe, expect, it, vi } from "vitest";
import { buildSystemPrompt, generateReply, type ReplyDeps } from "./reply";
import { MORENO_SYSTEM_PROMPT } from "./system-prompt";

function deps(hits: string[][] = [["milei es globalizador", "milei no es de derecha"]]): ReplyDeps & {
  complete: ReturnType<typeof vi.fn>;
  search: ReturnType<typeof vi.fn>;
} {
  let call = 0;
  return {
    complete: vi.fn().mockResolvedValue("Mirá, Milei es un globalizador."),
    random: () => "frase al azar",
    search: vi.fn().mockImplementation(() =>
      (hits[Math.min(call++, hits.length - 1)] ?? []).map((text, index) => ({ text, index, score: 1 }))
    ),
  };
}

describe("buildSystemPrompt", () => {
  it("sin frases devuelve el prompt base", () => {
    expect(buildSystemPrompt([])).toBe(MORENO_SYSTEM_PROMPT);
  });
  it("agrega las frases reales y recorta las largas", () => {
    const p = buildSystemPrompt(["corta", "x".repeat(500)]);
    expect(p).toContain("- corta");
    expect(p).toContain("x".repeat(260) + "…");
    expect(p).not.toContain("x".repeat(261));
  });
});

describe("generateReply", () => {
  it("busca con el último mensaje, inyecta frases y devuelve fuentes reales", async () => {
    const d = deps();
    const r = await generateReply([{ role: "user", content: "¿Qué pensás de Milei?" }], d);
    expect(r.text).toBe("Mirá, Milei es un globalizador.");
    expect(r.sources).toEqual(["milei es globalizador", "milei no es de derecha"]);
    expect(d.search).toHaveBeenCalledWith("¿Qué pensás de Milei?", 5);
    const [messages, opts] = d.complete.mock.calls[0];
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("- milei es globalizador");
    expect(messages.at(-1)).toEqual({ role: "user", content: "¿Qué pensás de Milei?" });
    expect(opts.maxTokens).toBeLessThanOrEqual(250);
  });

  it("si el último mensaje no encuentra nada, combina con el anterior", async () => {
    const d = deps([[], ["kicillof devaluo"]]);
    const r = await generateReply(
      [
        { role: "user", content: "Kicillof" },
        { role: "assistant", content: "..." },
        { role: "user", content: "¿y por qué?" },
      ],
      d
    );
    expect(d.search).toHaveBeenLastCalledWith("Kicillof ¿y por qué?", 5);
    expect(r.sources).toEqual(["kicillof devaluo"]);
  });

  it("manda como mucho los últimos 6 turnos", async () => {
    const d = deps();
    const history = Array.from({ length: 15 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `m${i}`,
    }));
    await generateReply(history, d);
    expect(d.complete.mock.calls[0][0]).toHaveLength(7);
  });

  it("si el LLM falla, responde en modo archivo con frases reales", async () => {
    const d = deps();
    d.complete.mockImplementation(async () => {
      throw new Error("429 sin cupo");
    });
    const onLlmError = vi.fn();
    const r = await generateReply([{ role: "user", content: "Milei" }], { ...d, onLlmError });
    expect(r.mode).toBe("archivo");
    expect(r.text).toMatch(/“Milei (es globalizador|no es de derecha)\.”/);
    expect(r.sources).toEqual(["milei es globalizador", "milei no es de derecha"]);
    expect(onLlmError).toHaveBeenCalled();
  });

  it("con el LLM andando, el modo es ia", async () => {
    const r = await generateReply([{ role: "user", content: "Milei" }], deps());
    expect(r.mode).toBe("ia");
  });

  it("falla si no hay mensaje del usuario", async () => {
    await expect(generateReply([{ role: "assistant", content: "hola" }], deps())).rejects.toThrow();
  });
});
