// Registra el webhook del bot y sus comandos. Se corre una vez (y cada vez que cambie el dominio):
//   npm run telegram:setup
// Lee del .env: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET y SITE_URL (ej. https://modo-guillermo.vercel.app)
const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret, SITE_URL: site } = process.env;
if (!token || !secret || !site) {
  console.error("Faltan TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET o SITE_URL en el .env");
  process.exit(1);
}

async function tg(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log(`${method}: ${data.ok ? "OK" : "ERROR " + data.description}`);
  if (!data.ok) process.exitCode = 1;
  return data;
}

const me = await tg("getMe", {});
if (me.ok) console.log(`Bot: @${me.result.username}  (poné TELEGRAM_BOT_USERNAME=${me.result.username} en Vercel)`);

await tg("setWebhook", {
  url: `${site.replace(/\/+$/, "")}/api/telegram`,
  secret_token: secret,
  allowed_updates: ["message"],
  drop_pending_updates: true,
});
await tg("setMyCommands", {
  commands: [
    { command: "frase", description: "Una frase real de Guillermo Moreno" },
    { command: "nueva", description: "Empezar una charla nueva" },
    { command: "moreno", description: "Preguntarle algo (en grupos)" },
    { command: "ayuda", description: "Cómo usar el bot" },
  ],
});
await tg("setMyShortDescription", {
  short_description: "Preguntale lo que quieras a Guillermo Moreno. Producción y trabajo, no especulación y renta.",
});
await tg("setMyDescription", {
  description:
    "El Modo Moreno: asistente de IA entrenado con frases públicas de Guillermo Moreno. Escribí tu pregunta o usá /frase para una frase real.",
});
const info = await tg("getWebhookInfo", {});
if (info.ok) console.log("Webhook:", info.result.url, info.result.last_error_message ? `(último error: ${info.result.last_error_message})` : "");
