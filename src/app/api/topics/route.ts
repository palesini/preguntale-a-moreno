import { NextResponse } from "next/server";
import topics from "@/data/topics.json";
import stats from "@/data/stats.json";

export async function GET() {
  return NextResponse.json({ topics, stats });
}
