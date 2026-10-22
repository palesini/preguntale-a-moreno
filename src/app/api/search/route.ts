import { NextResponse } from "next/server";
import { getCorpus } from "@/lib/moreno/corpus";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const q = (params.get("q") || "").slice(0, 200);
  const limit = Math.min(20, Math.max(1, Number(params.get("limit")) || 10));
  const results = getCorpus().search(q, limit).map((h) => h.text);
  return NextResponse.json({ results, query: q, total: results.length });
}
