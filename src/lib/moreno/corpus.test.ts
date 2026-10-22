import { describe, expect, it } from "vitest";
import { createIndex, getCorpus, normalize, tokenize } from "./corpus";

describe("normalize/tokenize", () => {
  it("saca acentos, signos y stopwords, y unifica plurales", () => {
    expect(normalize("¿Qué pensás de MILEI?")).toBe("que pensas de milei");
    expect(tokenize("¿Qué pensás de los pueblos?")).toEqual(["pueblo"]);
  });
});

describe("createIndex", () => {
  const idx = createIndex([
    "la energia cara destruye trabajo",
    "milei es un globalizador extremo",
    "kicillof devaluo en el 14 y milei tambien devaluo",
    "el asado del domingo",
  ]);

  it("devuelve primero la frase más relevante", () => {
    const hits = idx.search("¿Qué opinás de Milei y la globalización?");
    expect(hits[0].text).toBe("milei es un globalizador extremo");
    expect(hits.map((h) => h.index)).toContain(2);
  });

  it("no devuelve nada si no hay coincidencias o la consulta es solo stopwords", () => {
    expect(idx.search("fútbol")).toEqual([]);
    expect(idx.search("¿qué es eso?")).toEqual([]);
  });

  it("respeta k", () => {
    expect(idx.search("milei devaluo", 1)).toHaveLength(1);
  });
});

describe("corpus real", () => {
  it("carga las frases y encuentra a Kicillof", () => {
    const c = getCorpus();
    expect(c.size).toBeGreaterThan(2000);
    const hits = c.search("Kicillof", 3);
    expect(hits).toHaveLength(3);
    for (const h of hits) expect(normalize(h.text)).toContain("kicillof");
  });
});
