// Rate limit en memoria (ventana fija por clave). Alcanza para un servidor único;
// en serverless con varias instancias, cambiarlo por Upstash/Redis manteniendo esta interfaz.
export interface RateLimiter {
  check(key: string): { ok: true } | { ok: false; retryAfterSec: number };
}

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
  now?: () => number;
}): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return {
    check(key) {
      const t = now();
      let b = buckets.get(key);
      if (!b || t >= b.resetAt) {
        if (buckets.size >= maxKeys) {
          for (const [k, v] of buckets) if (t >= v.resetAt) buckets.delete(k);
          if (buckets.size >= maxKeys) buckets.delete(buckets.keys().next().value!);
        }
        b = { count: 0, resetAt: t + windowMs };
        buckets.set(key, b);
      }
      if (b.count >= limit) return { ok: false, retryAfterSec: Math.ceil((b.resetAt - t) / 1000) };
      b.count++;
      return { ok: true };
    },
  };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "anon";
}
