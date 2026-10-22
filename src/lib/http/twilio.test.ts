import { describe, expect, it } from "vitest";
import { isValidTwilioSignature, twilioSignature, twiml } from "./twilio";

// Valores esperados calculados con el SDK oficial (twilio@5, getExpectedTwilioSignature).
const url = "https://mycompany.com/myapp.php?foo=1&bar=2";
const params = new URLSearchParams({
  CallSid: "CA1234567890ABCDE",
  Caller: "+12349013030",
  Digits: "1234",
  From: "+12349013030",
  To: "+18005551212",
});

describe("firma de Twilio", () => {
  it("coincide con el SDK oficial de Twilio", () => {
    expect(twilioSignature("12345", url, params)).toBe("0/KCTR6DLpKmkAf8muzZqo1nDgQ=");
    const wa = new URLSearchParams({ Body: "Qué pensás de Milei?", From: "whatsapp:+5491100000000" });
    expect(twilioSignature("tok", "https://x.com/api/whatsapp", wa)).toBe("Rs4NMaWbnkTr6VLJAicTuAlYTnw=");
  });

  it("valida la firma correcta y rechaza firmas ausentes, erróneas o con datos alterados", () => {
    const sig = twilioSignature("12345", url, params);
    expect(isValidTwilioSignature("12345", url, params, sig)).toBe(true);
    expect(isValidTwilioSignature("12345", url, params, null)).toBe(false);
    expect(isValidTwilioSignature("otro", url, params, sig)).toBe(false);
    const tampered = new URLSearchParams(params);
    tampered.set("Digits", "9999");
    expect(isValidTwilioSignature("12345", url, tampered, sig)).toBe(false);
  });
});

describe("twiml", () => {
  it("escapa XML", () => {
    expect(twiml("a < b & \"c\"")).toContain("<Message>a &lt; b &amp; &quot;c&quot;</Message>");
  });
});
