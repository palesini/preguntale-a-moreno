import { createHmac, timingSafeEqual } from "crypto";

// Firma de Twilio: HMAC-SHA1 (base64) de la URL pública + cada parámetro POST
// ordenado por nombre, concatenando nombre y valor. https://www.twilio.com/docs/usage/security
export function twilioSignature(authToken: string, url: string, params: URLSearchParams): string {
  const keys = [...new Set(params.keys())].sort();
  let data = url;
  for (const k of keys) for (const v of params.getAll(k)) data += k + v;
  return createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
}

export function isValidTwilioSignature(
  authToken: string,
  url: string,
  params: URLSearchParams,
  signature: string | null
): boolean {
  if (!signature) return false;
  const expected = Buffer.from(twilioSignature(authToken, url, params));
  const got = Buffer.from(signature);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export function twiml(message: string): string {
  const esc = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${esc}</Message></Response>`;
}
