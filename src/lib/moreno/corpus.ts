// Búsqueda sobre el corpus real de frases (BM25, sin dependencias).
import frasesData from "@/data/frases.json";

export interface Hit {
  index: number;
  text: string;
  score: number;
}

const STOPWORDS = new Set(
  (
    "de la que el en y a los se del las un por con no una su para es al lo como mas pero sus le ya o " +
    "este si porque esta entre cuando muy sin sobre tambien me hasta hay donde quien desde todo nos " +
    "durante todos uno les ni contra otros ese eso ante ellos e esto mi antes algunos que unos yo otro " +
    "otras otra el tanto esa estos mucho quienes nada muchos cual poco ella estar estas algunas algo " +
    "nosotros vos te ti tu tus ellas nosotras vosotros os mio mia tuyo suyo nuestro nuestra fue son ser " +
    "era sea hace hacer tiene tienen tenes sos va van vamos esta estan estas estoy decir dice dijo bueno " +
    "entonces asi aca ahi ahora vez cosa cosas pensas opinas pensa que como cual qué cómo"
  ).split(" ")
);

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Stemming mínimo: plural simple ("pueblos" → "pueblo", "chinos" → "chino").
function stem(t: string): string {
  if (t.length > 4 && t.endsWith("es") && !t.endsWith("ses")) return t.slice(0, -2);
  if (t.length > 3 && t.endsWith("s")) return t.slice(0, -1);
  return t;
}

export function tokenize(s: string): string[] {
  return normalize(s)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map(stem);
}

export interface CorpusIndex {
  size: number;
  search(query: string, k?: number): Hit[];
  get(index: number): string | undefined;
  random(): string;
}

export function createIndex(docs: string[], k1 = 1.5, b = 0.75): CorpusIndex {
  const termFreqs: Map<string, number>[] = [];
  const docFreq = new Map<string, number>();
  let totalLen = 0;

  for (const doc of docs) {
    const tokens = tokenize(doc);
    totalLen += tokens.length;
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    termFreqs.push(tf);
    for (const t of tf.keys()) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
  }
  const lengths = termFreqs.map((tf) => [...tf.values()].reduce((a, c) => a + c, 0));
  const avgLen = totalLen / Math.max(1, docs.length);
  const N = docs.length;

  const idf = (t: string) => {
    const n = docFreq.get(t) ?? 0;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  };

  return {
    size: N,
    get: (i) => docs[i],
    random: () => docs[Math.floor(Math.random() * docs.length)],
    search(query, k = 5) {
      const terms = [...new Set(tokenize(query))];
      if (terms.length === 0) return [];
      const hits: Hit[] = [];
      for (let i = 0; i < N; i++) {
        const tf = termFreqs[i];
        let score = 0;
        for (const t of terms) {
          const f = tf.get(t);
          if (!f) continue;
          score += (idf(t) * f * (k1 + 1)) / (f + k1 * (1 - b + (b * lengths[i]) / avgLen));
        }
        if (score > 0) hits.push({ index: i, text: docs[i], score });
      }
      return hits.sort((a, b2) => b2.score - a.score).slice(0, k);
    },
  };
}

let defaultIndex: CorpusIndex | null = null;

export function getCorpus(): CorpusIndex {
  if (!defaultIndex) defaultIndex = createIndex(frasesData as string[]);
  return defaultIndex;
}
