# Fase 1 — Que funcione de verdad

Objetivo: que el chat responda con un LLM real, apoyado en el corpus real, con una API segura y respuestas cortas.

## Decisiones
- **LLM**: adaptador compatible con la API de OpenAI (`/chat/completions`). Sirve para OpenAI, Groq, OpenRouter, DeepSeek, etc.
  Se configura en `.env`: `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`. Se elimina `z-ai-web-dev-sdk`.
- **Sin respuestas falsas**: si el LLM falla, la API devuelve 503 y la UI muestra un error claro (se borran los fallbacks enlatados).
- **RAG real**: búsqueda BM25 sobre `frases.json` (sin acentos, con stopwords). Las 6 frases top se inyectan en el prompt y se devuelven como "frases fuente" reales.
- **Respuestas cortas**: 2 a 4 oraciones (40–90 palabras), `max_tokens` 220.
- **Un solo motor**: `lib/moreno/reply.ts` lo usan la web y WhatsApp (y después Telegram/Discord).

## Tickets
- [x] T1 Motor de corpus: `lib/moreno/corpus.ts` (normalizar + BM25) con tests. `/api/search` lo usa.
- [x] T2 Adaptador LLM: `lib/moreno/llm.ts` (fetch a OpenAI-compatible, timeout, errores tipados) con tests.
- [x] T3 Motor de respuesta: `lib/moreno/reply.ts` (prompt + frases recuperadas + historial) con tests.
- [x] T4 `/api/chat`: validación zod (solo roles user/assistant, límites de largo y cantidad), rate limit por IP, 503 si falla el LLM. Tests.
- [x] T5 `/api/whatsapp`: parseo con URLSearchParams (arregla el bug de los `+`), validación de firma de Twilio, usa el motor compartido. Tests.
- [x] T6 System prompt: respuestas cortas, sacar las frases semilla hardcodeadas, Francisco en pasado, admitir que es una IA paródica solo si se lo preguntan en serio.
- [x] T7 UI mínima: mostrar el error real, "Frase" con estilo de recorte del corpus, toast en vez de alert().
- [x] T8 Limpieza: dependencias sin usar, `ignoreBuildErrors`, scripts multiplataforma, favicon, rutas del script Python, `.env.example`.
- [x] T9 Verificación: tests verdes, `next build` OK, prueba end-to-end contra un LLM simulado.

## Revisión
- 38 tests en verde (corpus, LLM, motor, rate limit, firma de Twilio, /api/chat, /api/whatsapp, /api/search). `tsc` y `eslint` limpios. `next build` OK.
- Prueba de punta a punta con un LLM simulado (OpenAI-compatible): el prompt llega con las 6 frases reales, `max_tokens` 220, historial correcto; las fuentes devueltas son del corpus real.
- Rechazos verificados en el servidor real: rol `system` → 400; sin `LLM_API_KEY` → 503 con mensaje claro; 16.º pedido/min → 429; firma de Twilio falsa → 403; firma válida (calculada con el SDK oficial de Twilio) → TwiML.
- Bugs encontrados y corregidos en el camino: `+` de WhatsApp no se decodificaba como espacio; el historial de WhatsApp se mutaba después de pasárselo al motor.
- UI verificada con capturas (desktop y mobile): fuentes reales, "Frase real del corpus" con estilo propio, error con "Reintentar", aviso de IA.
- No verificado acá: llamada a un LLM real (la red de la VM bloquea las APIs) y las Google Fonts (idem). Probar en la PC con una key real.

## Pendiente (fases siguientes)
- Fase 2: rediseño (chat protagonista, cabecera compacta, streaming, compartir como imagen con next/og, sacar el panel de WhatsApp de la página pública, temas → preguntas).
- Fase 3: Telegram y luego WhatsApp con historial persistente.
- Fase 4: limpieza del corpus (typos, frases larguísimas, topics duplicados), git + deploy en Vercel.
