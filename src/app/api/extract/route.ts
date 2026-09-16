import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { extractJobDetails } from "@/lib/gemini";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { sourceUrl?: string; sourceText?: string };
  const result = await extractJobDetails({
    sourceUrl: body.sourceUrl,
    sourceText: body.sourceText,
  });
  return NextResponse.json(result);
}
