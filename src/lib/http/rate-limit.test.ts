import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("corta después del límite y se libera al pasar la ventana", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("a").ok).toBe(true);
    expect(rl.check("a")).toEqual({ ok: false, retryAfterSec: 1 });
    expect(rl.check("b").ok).toBe(true);
    t = 1000;
    expect(rl.check("a").ok).toBe(true);
  });

  it("no crece sin límite de claves", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2, now: () => 0 });
    rl.check("a"); rl.check("b"); rl.check("c");
    expect(rl.check("a").ok).toBe(true); // "a" fue desalojada
  });
});

describe("clientIp", () => {
  it("toma la primera IP de x-forwarded-for", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientIp(req)).toBe("1.2.3.4");
  });
});
