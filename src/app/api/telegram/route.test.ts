import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateReply = vi.fn();
vi.mock("@/lib/moreno/reply", () => ({ generateReply: (...a: unknown[]) => generateReply(...a) }));

const { POST, _resetConversations } = await import("./route");

function call(update: unknown, secret: string | null = "s3cr3t") {
  return POST(
    new Request("https://x/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(secret ? { "x-telegram-bot-api-secret-token": secret } : {}) },
      body: JSON.stringify(update),
    })
  );
}
const msg = (text: string, id = 42, type = "private") => ({
  update_id: 1,
  message: { message_id: 9, text, chat: { id, type }, from: { first_name: "Javier" } },
});

beforeEach(() => {
  vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "s3cr3t");
  vi.stubEnv("TELEGRAM_BOT_USERNAME", "ElModoMorenoBot");
  generateReply.mockReset();
  generateReply.mockImplementation(async () => ({ text: "Mirá, muchacho.", sources: [], mode: "ia" }));
  _resetConversations();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/telegram", () => {
  it("503 si no está configurado y 401 con secreto inválido", async () => {
    expect((await call(msg("hola"), "otro")).status).toBe(401);
    expect((await call(msg("hola"), null)).status).toBe(401);
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "");
    expect((await call(msg("hola"))).status).toBe(503);
  });

  it("contesta una pregunta con sendMessage en el cuerpo", async () => {
    const res = await call(msg("¿Qué pensás de Milei?"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ method: "sendMessage", chat_id: 42, text: "Mirá, muchacho." });
    expect(generateReply.mock.calls[0][0]).toEqual([{ role: "user", content: "¿Qué pensás de Milei?" }]);
  });

  it("guarda historial por chat y /nueva lo borra", async () => {
    await call(msg("Hola"));
    await call(msg("¿Y Kicillof?"));
    expect(generateReply.mock.calls[1][0]).toHaveLength(3);
    await call(msg("/nueva"));
    await call(msg("Otra"));
    expect(generateReply.mock.calls[2][0]).toHaveLength(1);
  });

  it("/start saluda por el nombre y /frase trae una frase real sin llamar a la IA", async () => {
    expect((await (await call(msg("/start"))).json()).text).toContain("Hola, Javier.");
    const frase = await (await call(msg("/frase"))).json();
    expect(frase.text).toMatch(/^“[\s\S]+”\n— Guillermo Moreno$/);
    expect(generateReply).not.toHaveBeenCalled();
  });

  it("en grupos ignora la charla y no responde nada", async () => {
    const res = await call(msg("che, ¿quién trae el carbón?", -100, "group"));
    expect(await res.json()).toEqual({});
    expect(generateReply).not.toHaveBeenCalled();
  });

  it("si algo explota igual contesta (Telegram no reintenta en loop)", async () => {
    generateReply.mockImplementation(async () => {
      throw new Error("x");
    });
    const res = await call(msg("hola"));
    expect(res.status).toBe(200);
    expect((await res.json()).text).toContain("Se cortó la línea");
  });

  it("limita a 10 mensajes por minuto por chat", async () => {
    for (let i = 0; i < 10; i++) await call(msg(`m${i}`, 77));
    expect((await (await call(msg("otra", 77))).json()).text).toContain("Pará un poco");
  });
});
