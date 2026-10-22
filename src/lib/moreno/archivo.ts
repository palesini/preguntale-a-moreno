// "Modo archivo": responde sin IA, con frases reales del corpus. Costo cero, sin límites.
// Se usa como respaldo automático cuando el LLM no está configurado, se pasa del cupo o falla.
import type { Hit } from "./corpus";

const OPENERS = [
  "Mirá, te digo una cosa:",
  "Escuchame bien, que esto ya lo dije:",
  "Fijate lo que te digo:",
  "Yo lo dije y lo sostengo:",
  "Te lo explico como lo dije siempre:",
];
const OFF_TOPIC_OPENERS = [
  "De eso no hablé, pero te digo lo que sí dije:",
  "Mirá, eso no lo traté, pero escuchá esto:",
];
const CLOSERS = ["¿Entendés?", "Así es la cosa.", "Y eso es el peronismo, muchachos.", "Mirá, esto es así."];
const MAX_QUOTE_CHARS = 420;

export interface ArchivoDeps {
  search: (query: string, k: number) => Hit[];
  random: () => string;
  rnd?: () => number;
}

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length) % arr.length];
}

// Capitaliza, recorta en un final de oración si es muy larga y asegura el punto final.
export function tidyQuote(raw: string): string {
  let t = raw.trim().replace(/\s+/g, " ");
  if (t.length > MAX_QUOTE_CHARS) {
    const cut = t.slice(0, MAX_QUOTE_CHARS);
    const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
    t = end > 80 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, "") + "…";
  }
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?…]$/.test(t)) t += ".";
  return t;
}

export function archivoReply(query: string, deps: ArchivoDeps): { text: string; sources: string[] } {
  const rnd = deps.rnd ?? Math.random;
  const hits = deps.search(query, 3);
  // Variar entre las mejores para no repetir siempre la misma frase.
  const chosen = hits.length ? hits[Math.floor(rnd() * Math.min(2, hits.length))].text : deps.random();
  const opener = hits.length ? pick(OPENERS, rnd) : pick(OFF_TOPIC_OPENERS, rnd);
  return {
    text: `${opener} “${tidyQuote(chosen)}” ${pick(CLOSERS, rnd)}`,
    sources: hits.map((h) => h.text),
  };
}
