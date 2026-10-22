import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { twilioSignature } from "@/lib/http/twilio";

const generateReply = vi.fn();
vi.mock("@/lib/moreno/reply", () => ({ generateReply: (...a: unknown[]) => generateReply(...a) }));

const { POST, _resetConversations } = await import("./route");
const URL_ = "https://moreno.test/api/whatsapp";

function form(fields: Record<string, string>, headers: Record<string, string> = {}) {
  return new Request(URL_, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(fields).toString(),
  });
}

beforeEach(() => {
  generateReply.mockReset();
  generateReply.mockImplementation(async () => ({ text: "Mirá, muchacho.", sources: [] }));
  _resetConversations();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/whatsapp — modo demo", () => {
  it("decodifica bien espacios ('+') y acentos del Body", async () => {
    const res = await POST(form({ Body: "¿Qué pensás de Milei?", From: "whatsapp:+5491111111111" }));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Mirá, muchacho.");
    expect(generateReply.mock.calls[0][0]).toEqual([{ role: "user", content: "¿Qué pensás de Milei?" }]);
  });

  it("mantiene historial por número", async () => {
    await POST(form({ Body: "Hola", From: "whatsapp:+1" }));
    await POST(form({ Body: "¿Y Kicillof?", From: "whatsapp:+1" }));
    await POST(form({ Body: "Otro", From: "whatsapp:+2" }));
    expect(generateReply.mock.calls[1][0]).toHaveLength(3);
    expect(generateReply.mock.calls[2][0]).toHaveLength(1);
  });

  it("400 si no hay Body", async () => {
    expect((await POST(form({ From: "whatsapp:+1" }))).status).toBe(400);
  });

  it("no expone el modo demo en producción", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect((await POST(form({ Body: "hola" }))).status).toBe(503);
  });
});

describe("POST /api/whatsapp — con Twilio configurado", () => {
  beforeEach(() => vi.stubEnv("TWILIO_AUTH_TOKEN", "secreto"));
  const fields = { Body: "¿Qué pensás de Milei?", From: "whatsapp:+5491111111111" };

  it("rechaza pedidos sin firma o con firma inválida", async () => {
    expect((await POST(form(fields))).status).toBe(403);
    expect((await POST(form(fields, { "x-twilio-signature": "falsa" }))).status).toBe(403);
    expect(generateReply).not.toHaveBeenCalled();
  });

  it("con firma válida responde TwiML", async () => {
    const sig = twilioSignature("secreto", URL_, new URLSearchParams(fields));
    const res = await POST(form(fields, { "x-twilio-signature": sig }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/xml");
    expect(await res.text()).toContain("<Message>Mirá, muchacho.</Message>");
  });

  it("si el LLM falla igual contesta algo en TwiML (Twilio no reintenta en loop)", async () => {
    generateReply.mockImplementation(async () => {
      throw new Error("caído");
    });
    const sig = twilioSignature("secreto", URL_, new URLSearchParams(fields));
    const res = await POST(form(fields, { "x-twilio-signature": sig }));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("se cortó la línea");
  });
});
