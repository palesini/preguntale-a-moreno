// Motor único de respuesta "Modo Guillermo": lo usan la web, WhatsApp y los bots que vengan.
import { getCorpus, type Hit } from "./corpus";
import { complete, type CompleteOptions, type LlmMessage } from "./llm";
import { MORENO_SYSTEM_PROMPT } from "./system-prompt";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface Reply {
  text: string;
  sources: string[];
}

export interface ReplyDeps {
  complete: (messages: LlmMessage[], opts: CompleteOptions) => Promise<string>;
  search: (query: string, k: number) => Hit[];
}

const defaultDeps: ReplyDeps = {
  complete: (messages, opts) => complete(messages, opts),
  search: (query, k) => getCorpus().search(query, k),
};

export const REPLY_OPTIONS: CompleteOptions = { maxTokens: 220, temperature: 0.8 };
const HISTORY_TURNS = 10;
const CONTEXT_FRASES = 6;
const SOURCES_SHOWN = 3;
const MAX_FRASE_CHARS = 320;

export function buildSystemPrompt(frases: string[]): string {
  if (frases.length === 0) return MORENO_SYSTEM_PROMPT;
  const list = frases
    .map((f) => `- ${f.length > MAX_FRASE_CHARS ? f.slice(0, MAX_FRASE_CHARS) + "…" : f}`)
    .join("\n");
  return `${MORENO_SYSTEM_PROMPT}

## COSAS QUE DIJISTE DE VERDAD SOBRE ESTE TEMA
Usalas como base de tu postura y tu forma de decir las cosas. No las copies textual ni las enumeres.
${list}`;
}

export async function generateReply(history: ChatTurn[], deps: ReplyDeps = defaultDeps): Promise<Reply> {
  const turns = history.slice(-HISTORY_TURNS);
  const userTurns = turns.filter((t) => t.role === "user");
  const last = userTurns[userTurns.length - 1];
  if (!last) throw new Error("generateReply necesita al menos un mensaje del usuario");

  // Buscar con el último mensaje; si es muy corto ("¿y él?"), sumar el anterior para tener contexto.
  let hits = deps.search(last.content, CONTEXT_FRASES);
  if (hits.length < 2 && userTurns.length > 1) {
    hits = deps.search(`${userTurns[userTurns.length - 2].content} ${last.content}`, CONTEXT_FRASES);
  }
  const frases = hits.map((h) => h.text);

  const messages: LlmMessage[] = [
    { role: "system", content: buildSystemPrompt(frases) },
    ...turns,
  ];
  const text = await deps.complete(messages, REPLY_OPTIONS);
  return { text, sources: frases.slice(0, SOURCES_SHOWN) };
}
