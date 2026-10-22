import { describe, expect, it } from "vitest";
import { parseIntent, sendMessage, type TgUpdate } from "./telegram";

const BOT = "ElModoMorenoBot";
function upd(text: string | undefined, type: "private" | "group" = "private", extra = {}): TgUpdate {
  return { update_id: 1, message: { message_id: 7, text, chat: { id: 42, type }, ...extra } };
}

describe("parseIntent — chat privado", () => {
  it("texto libre es una pregunta", () => {
    expect(parseIntent(upd("¿Qué pensás de Milei?"), BOT)).toEqual({ kind: "ask", text: "¿Qué pensás de Milei?" });
  });
  it("reconoce comandos, con o sin @bot", () => {
    expect(parseIntent(upd("/start"), BOT).kind).toBe("start");
    expect(parseIntent(upd("/frase@ElModoMorenoBot"), BOT).kind).toBe("frase");
    expect(parseIntent(upd("/nueva"), BOT).kind).toBe("reset");
    expect(parseIntent(upd("/ayuda"), BOT).kind).toBe("help");
    expect(parseIntent(upd("/moreno ¿y Kicillof?"), BOT)).toEqual({ kind: "ask", text: "¿y Kicillof?" });
  });
  it("comando desconocido muestra ayuda; comando para otro bot se ignora", () => {
    expect(parseIntent(upd("/cualquiera"), BOT).kind).toBe("help");
    expect(parseIntent(upd("/frase@OtroBot"), BOT).kind).toBe("ignore");
  });
  it("ignora mensajes sin texto (stickers, fotos)", () => {
    expect(parseIntent(upd(undefined), BOT).kind).toBe("ignore");
    expect(parseIntent({ update_id: 1 }, BOT).kind).toBe("ignore");
  });
});

describe("parseIntent — grupos", () => {
  it("ignora la charla normal del grupo", () => {
    expect(parseIntent(upd("che, ¿vamos al asado?", "group"), BOT).kind).toBe("ignore");
  });
  it("contesta si lo mencionan, sacando la mención", () => {
    expect(parseIntent(upd("@ElModoMorenoBot ¿qué pensás de China?", "group"), BOT)).toEqual({
      kind: "ask",
      text: "¿qué pensás de China?",
    });
  });
  it("contesta si le responden a un mensaje suyo", () => {
    const u = upd("¿y eso por qué?", "group", { reply_to_message: { from: { is_bot: true, username: BOT } } });
    expect(parseIntent(u, BOT)).toEqual({ kind: "ask", text: "¿y eso por qué?" });
  });
  it("con /moreno pregunta", () => {
    expect(parseIntent(upd("/moreno@ElModoMorenoBot la deuda", "group"), BOT)).toEqual({ kind: "ask", text: "la deuda" });
  });
});

describe("sendMessage", () => {
  it("en privado no cita el mensaje; en grupo sí", () => {
    const priv = sendMessage(upd("x").message!, "hola");
    expect(priv).toMatchObject({ method: "sendMessage", chat_id: 42, text: "hola" });
    expect(priv).not.toHaveProperty("reply_parameters");
    const grp = sendMessage(upd("x", "group").message!, "hola");
    expect(grp).toMatchObject({ reply_parameters: { message_id: 7 } });
  });
});
