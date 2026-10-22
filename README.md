# El Modo Guillermo

Chatbot con la personalidad de Guillermo Moreno, apoyado en un corpus de 2.564 frases públicas reales.
Respuestas generadas por IA: no son declaraciones reales.

## Cómo funciona
1. El usuario pregunta.
2. `lib/moreno/corpus.ts` busca (BM25) las 6 frases reales más relevantes del corpus.
3. `lib/moreno/reply.ts` arma el prompt (personaje + esas frases + historial) y llama al LLM.
4. La respuesta vuelve corta (2–4 oraciones) junto con las 3 frases en las que se basó.

El mismo motor (`generateReply`) lo usan la web (`/api/chat`) y WhatsApp (`/api/whatsapp`).

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
| `npm run corpus` | regenera `src/data/*.json` desde `upload/frases_moreno.txt` |

## LLM
Cualquier API compatible con OpenAI. Ejemplos en `.env.example` (OpenAI, Groq, OpenRouter, DeepSeek).
Si falta la key o el LLM falla, la API devuelve 503 con un mensaje claro: no hay respuestas inventadas de relleno.

## Seguridad
- `/api/chat` valida el body con zod: solo roles `user`/`assistant` (nadie puede inyectar un `system`), máx. 2.000 caracteres por mensaje.
- Rate limit en memoria: 15 pedidos/min por IP (`CHAT_RATE_LIMIT_PER_MIN`). En serverless con varias instancias conviene pasarlo a Upstash/Redis.
- `/api/whatsapp` valida la firma `X-Twilio-Signature` (verificada contra el SDK oficial). Sin `TWILIO_AUTH_TOKEN` solo funciona en modo demo fuera de producción.

## WhatsApp (Twilio)
1. Twilio → Messaging → WhatsApp Sandbox.
2. `.env`: `TWILIO_AUTH_TOKEN` y `TWILIO_WEBHOOK_URL=https://TU_DOMINIO/api/whatsapp`.
3. En Twilio, "When a message comes in" → `POST https://TU_DOMINIO/api/whatsapp`.

Prueba local (modo demo):
```bash
curl -X POST http://localhost:3000/api/whatsapp -d "Body=¿Qué pensás de Milei?" -d "From=whatsapp:+5491100000000"
```

## Estructura
```
src/
├── app/api/{chat,whatsapp,search,random,topics}/route.ts
├── components/moreno/        UI (header, chat, top-topics, whatsapp-panel, footer)
├── data/                     frases.json, topics.json, stats.json (generados)
└── lib/
    ├── moreno/               corpus.ts (BM25) · llm.ts (adaptador) · reply.ts (motor) · system-prompt.ts
    └── http/                 rate-limit.ts · twilio.ts
```
