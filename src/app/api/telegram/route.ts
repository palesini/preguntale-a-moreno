/**
 * Webhook del bot de Telegram — "El Modo Moreno".
 *
 * Variables de entorno (en Vercel):
 *   TELEGRAM_WEBHOOK_SECRET  secreto que Telegram manda en X-Telegram-Bot-Api-Secret-Token (obligatorio)
 *   TELEGRAM_BOT_USERNAME    usuario del bot sin @, para detectar menciones en grupos
 *
 * El token del bot solo hace falta para registrar el webhook: `npm run telegram:setup`.
 * Las respuestas van en el cuerpo de la respuesta del webhook (Telegram ejecuta el sendMessage).
 */
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { generateReply, type ChatTurn } from "@/lib/moreno/reply";
import { getCorpus } from "@/lib/moreno/corpus";
import { tidyQuote } from "@/lib/moreno/archivo";
import { createConversationStore } from "@/lib/moreno/conversations";
import { createRateLimiter } from "@/lib/http/rate-limit";
import { parseIntent, sendMessage, TEXTS, type TgUpdate } from "@/lib/moreno/telegram";

const conversations = createConversationStore({ maxTurns: 12 });
const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

export function _resetConversations() {
  conversations.clearAll();
}

function validSecret(expected: string, got: string | null): boolean {
  if (!got) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(got);
  return a.length === b.length && timingSafeEqual(a, b);
}

const ok = (body: object = {}) => NextResponse.json(body);

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return new Response("Telegram no configurado", { status: 503 });
  if (!validSecret(secret, req.headers.get("x-telegram-bot-api-secret-token"))) {
    return new Response("No autorizado", { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as TgUpdate | null;
  if (!update) return ok();
  const msg = update.message;
  const intent = parseIntent(update, process.env.TELEGRAM_BOT_USERNAME);
  if (!msg || intent.kind === "ignore") return ok();

  const chatId = String(msg.chat.id);
  switch (intent.kind) {
    case "start":
      return ok(sendMessage(msg, TEXTS.start(msg.from?.first_name)));
    case "help":
      return ok(sendMessage(msg, TEXTS.help));
    case "reset":
      conversations.clear(chatId);
      return ok(sendMessage(msg, TEXTS.reset));
    case "frase":
      return ok(sendMessage(msg, `“${tidyQuote(getCorpus().random())}”\n— Guillermo Moreno`));
  }

  if (!limiter.check(chatId).ok) return ok(sendMessage(msg, TEXTS.slowDown));

  const history = conversations.add(chatId, { role: "user", content: intent.text.slice(0, 1000) });
  try {
    const { text } = await generateReply(history);
    conversations.add(chatId, { role: "assistant", content: text } satisfies ChatTurn);
    return ok(sendMessage(msg, text));
  } catch (err) {
    console.error("[telegram]", err);
    return ok(sendMessage(msg, TEXTS.error));
  }
}
