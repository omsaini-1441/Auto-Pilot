import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const job = await prisma.job.findFirst({
    where: { id, userId: user.id },
    include: {
      contacts: { orderBy: { createdAt: "asc" } },
      drafts: { orderBy: { updatedAt: "desc" }, include: { contact: true } },
    },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json();
  const existing = await prisma.job.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const job = await prisma.job.update({
    where: { id },
    data: {
      company: body.company ?? undefined,
      role: body.role ?? undefined,
      location: body.location ?? undefined,
      notes: body.notes ?? undefined,
      status: body.status ?? undefined,
      sourceUrl: body.sourceUrl ?? undefined,
      sourceText: body.sourceText ?? undefined,
    },
  });
  return NextResponse.json({ job });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await prisma.job.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
