import { NextResponse } from "next/server";
import frasesData from "@/data/frases.json";

const frases = frasesData as string[];

export const dynamic = "force-dynamic";

export async function GET() {
  const index = Math.floor(Math.random() * frases.length);
  return NextResponse.json({ frase: frases[index], index, total: frases.length });
}
