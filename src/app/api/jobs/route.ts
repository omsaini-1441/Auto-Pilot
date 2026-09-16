import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      contacts: true,
      drafts: true,
      _count: { select: { contacts: true, drafts: true } },
    },
  });
  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const job = await prisma.job.create({
    data: {
      userId: user.id,
      sourceUrl: body.sourceUrl ?? "",
      sourceText: body.sourceText ?? "",
      company: body.company ?? "",
      role: body.role ?? "",
      location: body.location ?? "",
      notes: body.notes ?? "",
      status: body.status ?? "researching",
      extractMeta: body.extractMeta ? JSON.stringify(body.extractMeta) : "{}",
    },
  });
  return NextResponse.json({ job });
}
