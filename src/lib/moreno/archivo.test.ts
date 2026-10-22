import { describe, expect, it } from "vitest";
import { archivoReply, tidyQuote } from "./archivo";

const hit = (text: string) => ({ text, index: 0, score: 1 });

describe("tidyQuote", () => {
  it("capitaliza y agrega punto final", () => {
    expect(tidyQuote("la energia cara destruye trabajo")).toBe("La energia cara destruye trabajo.");
    expect(tidyQuote("¿y quién paga?")).toBe("¿y quién paga?");
  });
  it("recorta frases larguísimas en un final de oración", () => {
    const long = "a".repeat(100) + ". " + "b".repeat(500);
    expect(tidyQuote(long)).toBe("A".concat("a".repeat(99), "."));
  });
});

describe("archivoReply", () => {
  it("cita la frase real más relevante con apertura y cierre", () => {
    const r = archivoReply("kicillof", {
      search: () => [hit("kicillof no es peronista"), hit("otra")],
      random: () => "nunca",
      rnd: () => 0,
    });
    expect(r.text).toBe("Mirá, te digo una cosa: “Kicillof no es peronista.” ¿Entendés?");
    expect(r.sources).toEqual(["kicillof no es peronista", "otra"]);
  });
  it("si no hay coincidencias usa una frase al azar y lo dice", () => {
    const r = archivoReply("asado", { search: () => [], random: () => "el trabajo dignifica", rnd: () => 0 });
    expect(r.text).toContain("De eso no hablé");
    expect(r.text).toContain("“El trabajo dignifica.”");
    expect(r.sources).toEqual([]);
  });
});
