import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await prisma.template.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  if (body.isDefault) {
    await prisma.template.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }
  const template = await prisma.template.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      subject: body.subject ?? undefined,
      bodyHtml: body.bodyHtml ?? undefined,
      isDefault: body.isDefault ?? undefined,
    },
  });
  return NextResponse.json({ template });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await prisma.template.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.template.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
