import { NextResponse } from "next/server";
import { z } from "zod";
import { generateReply } from "@/lib/moreno/reply";
import { LlmError } from "@/lib/moreno/llm";
import { clientIp, createRateLimiter } from "@/lib/http/rate-limit";

const MessageSchema = z.object({
  // Solo user/assistant: el cliente nunca puede mandar un mensaje "system" y pisar el personaje.
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

const BodySchema = z.object({
  messages: z
    .array(MessageSchema)
    .min(1)
    .max(40)
    .refine((m) => m.length > 0 && m[m.length - 1].role === "user", "El último mensaje tiene que ser del usuario"),
});

const limiter = createRateLimiter({
  limit: Number(process.env.CHAT_RATE_LIMIT_PER_MIN) || 15,
  windowMs: 60_000,
});

export async function POST(req: Request) {
  const rl = limiter.check(clientIp(req));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Pará un poco, muchacho: demasiadas preguntas seguidas. Probá en un minuto." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Pedido inválido", details: parsed.error.issues.map((i) => i.message) },
      { status: 400 }
    );
  }

  try {
    const reply = await generateReply(parsed.data.messages);
    return NextResponse.json({
      response: reply.text,
      frases_fuente: reply.sources,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[chat]", err);
    const notConfigured = err instanceof LlmError && err.kind === "config";
    return NextResponse.json(
      {
        error: notConfigured
          ? "El chat no está configurado: falta LLM_API_KEY en el servidor."
          : "Moreno no está disponible ahora. Probá de nuevo en un rato.",
      },
      { status: 503 }
    );
  }
}
