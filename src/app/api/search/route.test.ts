import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/search", () => {
  it("busca en el corpus real con límite acotado", async () => {
    const res = await GET(new Request("http://x/api/search?q=pampa%20h%C3%BAmeda&limit=500"));
    const data = await res.json();
    expect(data.total).toBeGreaterThan(0);
    expect(data.total).toBeLessThanOrEqual(20);
  });
  it("consulta vacía → sin resultados", async () => {
    const data = await (await GET(new Request("http://x/api/search"))).json();
    expect(data.results).toEqual([]);
  });
});
