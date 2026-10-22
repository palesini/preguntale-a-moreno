// Lógica pura del bot de Telegram: qué hacer con cada mensaje y cómo responder.

export interface TgUser {
  username?: string;
  is_bot?: boolean;
  first_name?: string;
}

export interface TgMessage {
  message_id: number;
  text?: string;
  chat: { id: number; type: "private" | "group" | "supergroup" | "channel" };
  from?: TgUser;
  reply_to_message?: { from?: TgUser };
}

export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
}

export type Intent =
  | { kind: "ignore" }
  | { kind: "start" }
  | { kind: "help" }
  | { kind: "frase" }
  | { kind: "reset" }
  | { kind: "ask"; text: string };

const COMMANDS: Record<string, Intent["kind"]> = {
  start: "start",
  ayuda: "help",
  help: "help",
  frase: "frase",
  nueva: "reset",
};

export function parseIntent(update: TgUpdate, botUsername = ""): Intent {
  const msg = update.message;
  const text = msg?.text?.trim();
  if (!msg || !text) return { kind: "ignore" };
  const bot = botUsername.replace(/^@/, "").toLowerCase();
  const isPrivate = msg.chat.type === "private";

  const cmd = text.match(/^\/([a-z]+)(?:@(\w+))?(?:\s+([\s\S]*))?$/i);
  if (cmd) {
    const [, name, target, rest = ""] = cmd;
    if (target && target.toLowerCase() !== bot) return { kind: "ignore" }; // comando para otro bot
    const lower = name.toLowerCase();
    if (lower === "moreno") return rest.trim() ? { kind: "ask", text: rest.trim() } : { kind: "help" };
    const kind = COMMANDS[lower];
    if (!kind) return isPrivate ? { kind: "help" } : { kind: "ignore" };
    return { kind } as Intent;
  }

  if (isPrivate) return { kind: "ask", text };

  // En grupos solo contesta si lo nombran o le responden a un mensaje suyo.
  const mention = bot && new RegExp(`@${bot}\\b`, "i");
  if (mention && mention.test(text)) {
    const clean = text.replace(mention, "").trim();
    return clean ? { kind: "ask", text: clean } : { kind: "help" };
  }
  const replyFrom = msg.reply_to_message?.from;
  if (replyFrom?.is_bot && replyFrom.username?.toLowerCase() === bot) return { kind: "ask", text };
  return { kind: "ignore" };
}

// Respuesta directa en el cuerpo del webhook: Telegram ejecuta el método sin que hagamos otra llamada.
export function sendMessage(msg: TgMessage, text: string) {
  return {
    method: "sendMessage",
    chat_id: msg.chat.id,
    text: text.slice(0, 4000),
    link_preview_options: { is_disabled: true },
    ...(msg.chat.type !== "private" && {
      reply_parameters: { message_id: msg.message_id, allow_sending_without_reply: true },
    }),
  };
}

export const TEXTS = {
  start: (name?: string) =>
    `${name ? `Hola, ${name}. ` : ""}Preguntame lo que quieras, que la economía es producción y trabajo, no especulación y renta.\n\n/frase: una frase real de Guillermo Moreno\n/nueva: empezar una charla nueva\n\nEn grupos, nombrame (@) o escribí /moreno y tu pregunta.`,
  help: "Escribime tu pregunta, o usá:\n/frase: una frase real de Guillermo Moreno\n/nueva: empezar una charla nueva\n\nEn grupos: /moreno tu pregunta, o nombrame con @.",
  reset: "Listo, empezamos de nuevo. Preguntame lo que quieras.",
  slowDown: "Pará un poco, muchacho. Mandame de a una y en un minuto seguimos.",
  error: "Se cortó la línea. Probá de nuevo en un rato.",
};
