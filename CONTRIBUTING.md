# Cómo contribuir

Gracias por sumarte a **Preguntale a Moreno**.

## Arrancar
```bash
git clone https://github.com/palesini/preguntale-a-moreno.git
cd preguntale-a-moreno
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev               # http://localhost:3000
```
Sin `LLM_API_KEY` funciona igual en **modo archivo** (responde con citas reales del corpus).
Para la IA, sacá una key gratis en https://console.groq.com/keys (ver `.env.example`).

## Antes de mandar un PR
- `npm test`: tienen que pasar todos los tests. Si agregás comportamiento, sumá su test.
- `npm run typecheck` y `npm run lint`: sin errores.
- Un PR por tema, con una descripción corta de qué cambia y por qué.
- Nunca subas claves ni el archivo `.env`.

## Ideas para empezar
- **Limpiar el corpus** (`upload/frases_moreno.txt`): acentos, mayúsculas y errores de tipeo. Después `npm run corpus` regenera `src/data/frases.json`.
- **Sumar frases nuevas** de declaraciones públicas, con la fuente si es posible.
- **Streaming** de las respuestas en la web.
- **Compartir como imagen**: generar una tarjeta con la respuesta para redes.
- **Discord**: un bot que use el mismo motor (`generateReply` en `src/lib/moreno/reply.ts`).

## Cómo está armado
Ver la sección "Cómo funciona" del [README](README.md). El motor (`reply.ts`) es el mismo para la web, Telegram y WhatsApp.

## Licencia
Al contribuir, aceptás que tu aporte se publique bajo la licencia del proyecto, [AGPL-3.0-or-later](LICENSE).
