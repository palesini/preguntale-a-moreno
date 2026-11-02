# Preguntale a Moreno

Asistente de IA con la personalidad de Guillermo Moreno, entrenado con un corpus de 2.564 frases públicas reales.
Funciona en la web ([preguntaleamoreno.vercel.app](https://preguntaleamoreno.vercel.app)) y en Telegram ([@ElModoMorenoBot](https://t.me/ElModoMorenoBot)).

Creado por **Pablo Alesini**.

## Cómo funciona
1. El usuario pregunta.
2. `lib/moreno/corpus.ts` busca (BM25) las 6 frases reales más relevantes del corpus.
3. `lib/moreno/reply.ts` arma el prompt (personaje + esas frases + historial) y llama al LLM.
4. La respuesta vuelve corta (2–4 oraciones) junto con las 3 frases en las que se basó.

El mismo motor (`generateReply`) lo usan la web (`/api/chat`), Telegram (`/api/telegram`) y WhatsApp (`/api/whatsapp`, armado pero apagado por ahora).

## Arrancar en local (Windows / Mac / Linux)
```bash
npm install
copy .env.example .env      # en Mac/Linux: cp .env.example .env
# completá LLM_API_KEY (y LLM_BASE_URL / LLM_MODEL si no usás OpenAI)
npm run dev                  # http://localhost:3000
```

## Scripts
| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo |
| `npm test` | tests (vitest) |
| `npm run typecheck` | chequeo de tipos |
| `npm run build` / `npm start` | build y servidor de producción |
| `npm run corpus` | regenera `src/data/frases.json` desde `upload/frases_moreno.txt` |
| `npm run telegram:setup` | registra el webhook y los comandos del bot de Telegram |

## LLM
Cualquier API compatible con OpenAI. Ejemplos en `.env.example`. En producción se usa **Groq gratis** con `qwen/qwen3.8-27b`.

### Modo archivo (sin IA, costo cero)
Si no hay `LLM_API_KEY`, o el LLM falla o se pasa del cupo (el plan gratis de Groq da ~8.000 tokens/min),
la respuesta se arma con la frase real más relevante del corpus más una apertura y un cierre en su estilo
(`lib/moreno/archivo.ts`). La UI la marca como "Cita real del archivo". La API devuelve `modo: "ia" | "archivo"`.

## Seguridad
- `/api/chat` valida el body con zod: solo roles `user`/`assistant` (nadie puede inyectar un `system`), máx. 2.000 caracteres por mensaje.
- Rate limit en memoria: 15 pedidos/min por IP (`CHAT_RATE_LIMIT_PER_MIN`). En serverless con varias instancias conviene pasarlo a Upstash/Redis.
- `/api/whatsapp` valida la firma `X-Twilio-Signature` (verificada contra el SDK oficial). Sin `TWILIO_AUTH_TOKEN` solo funciona en modo demo fuera de producción.

## Telegram
1. En @BotFather: `/newbot` → guardá el token en `.env` como `TELEGRAM_BOT_TOKEN`.
2. En `.env`: `TELEGRAM_WEBHOOK_SECRET` (cualquier texto largo al azar) y `SITE_URL`.
3. En Vercel: `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_BOT_USERNAME` y `NEXT_PUBLIC_TELEGRAM_URL` (y redeploy).
4. `npm run telegram:setup` → registra el webhook, los comandos y la descripción.

Comandos: `/frase` (frase real), `/nueva` (charla nueva), `/moreno <pregunta>` (en grupos), `/ayuda`.
En grupos solo contesta si lo nombran con @, le responden a un mensaje suyo o usan `/moreno`.

## WhatsApp (Twilio) — apagado por ahora
El webhook `/api/whatsapp` está armado (firma de Twilio validada). Para activarlo: `TWILIO_AUTH_TOKEN` y
`TWILIO_WEBHOOK_URL=https://TU_DOMINIO/api/whatsapp` en Vercel, y esa URL en Twilio como "When a message comes in".

## Estructura
```
src/
├── app/api/{chat,telegram,whatsapp,search,random}/route.ts
├── components/moreno/        preguntale-a-moreno.tsx (toda la UI) · sol-de-mayo.tsx
├── data/                     frases.json (generado)
└── lib/
    ├── moreno/               corpus.ts (BM25) · llm.ts · reply.ts (motor) · archivo.ts · telegram.ts · conversations.ts · system-prompt.ts
    └── http/                 rate-limit.ts · twilio.ts
```
