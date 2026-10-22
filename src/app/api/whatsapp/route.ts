/**
 * Webhook de WhatsApp (Twilio) — "Modo Guillermo".
 *
 * Variables de entorno:
 *   TWILIO_AUTH_TOKEN    obligatorio en producción: se usa para validar la firma de cada pedido.
 *   TWILIO_WEBHOOK_URL   opcional: la URL pública exacta configurada en Twilio
 *                        (necesaria si estás detrás de un proxy y req.url no coincide).
 *
 * En Twilio: Messaging → WhatsApp → "When a message comes in" → POST https://TU_DOMINIO/api/whatsapp
 *
 * Sin TWILIO_AUTH_TOKEN y fuera de producción funciona en "modo demo" (responde texto plano)
 * para probar con curl:  curl -X POST localhost:3000/api/whatsapp -d "Body=Hola" -d "From=whatsapp:+5491100000000"
 */
import { generateReply, type ChatTurn } from "@/lib/moreno/reply";
import { createRateLimiter } from "@/lib/http/rate-limit";
import { isValidTwilioSignature, twiml } from "@/lib/http/twilio";

const MAX_TURNS_PER_USER = 20;
const MAX_USERS_IN_MEMORY = 500;
const MAX_BODY_CHARS = 1000;
const WHATSAPP_MAX_CHARS = 1500;

// Historial en memoria por número (se pierde al reiniciar; fase 3: pasarlo a una base).
const conversations = new Map<string, ChatTurn[]>();
const limiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

function remember(user: string, turn: ChatTurn): ChatTurn[] {
  const conv = conversations.get(user) ?? [];
  conversations.delete(user); // re-insertar para mantener orden LRU
  conv.push(turn);
  const trimmed = conv.slice(-MAX_TURNS_PER_USER);
  conversations.set(user, trimmed);
  if (conversations.size > MAX_USERS_IN_MEMORY) {
    conversations.delete(conversations.keys().next().value!);
  }
  return [...trimmed]; // copia: el llamador no debe ver mutaciones posteriores
}

export function _resetConversations() {
  conversations.clear();
}

function xml(body: string, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/xml; charset=utf-8" } });
}

export async function POST(req: Request) {
  const raw = await req.text();
  const params = new URLSearchParams(raw); // decodifica bien "+" como espacio y los %XX

  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const demoMode = !authToken;
  if (demoMode && process.env.NODE_ENV === "production") {
    return new Response("WhatsApp no configurado: falta TWILIO_AUTH_TOKEN", { status: 503 });
  }
  if (!demoMode) {
    const url = process.env.TWILIO_WEBHOOK_URL || req.url;
    if (!isValidTwilioSignature(authToken, url, params, req.headers.get("x-twilio-signature"))) {
      return new Response("Firma de Twilio inválida", { status: 403 });
    }
  }

  const body = (params.get("Body") || "").trim().slice(0, MAX_BODY_CHARS);
  const from = params.get("From") || "anon";
  if (!body) return new Response("Body vacío", { status: 400 });

  const reply = (text: string) =>
    demoMode
      ? new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
      : xml(twiml(text));

  if (!limiter.check(from).ok) {
    return reply("Pará un poco, muchacho. Mandame de a una y en un minuto seguimos.");
  }

  const history = remember(from, { role: "user", content: body });
  try {
    const { text } = await generateReply(history);
    remember(from, { role: "assistant", content: text });
    return reply(text.slice(0, WHATSAPP_MAX_CHARS));
  } catch (err) {
    console.error("[whatsapp]", err);
    return reply("Ahora no te puedo contestar, se cortó la línea. Probá en un rato.");
  }
}
