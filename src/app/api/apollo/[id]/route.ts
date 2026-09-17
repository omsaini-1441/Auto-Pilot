import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { apolloAccounts } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await apolloAccounts.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  if (body.isActive === true) {
    await apolloAccounts.updateMany({
      where: { userId: user.id },
      data: { isActive: false },
    });
  }

  const account = await apolloAccounts.update({
    where: { id },
    data: {
      label: body.label ?? undefined,
      loginHint: body.loginHint ?? undefined,
      notes: body.notes ?? undefined,
      isActive: body.isActive ?? undefined,
    },
  });
  return NextResponse.json({ account });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const existing = await apolloAccounts.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await apolloAccounts.delete({ where: { id } });
  if (existing.isActive) {
    const next = await apolloAccounts.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    if (next) {
      await apolloAccounts.update({ where: { id: next.id }, data: { isActive: true } });
    }
  }
  return NextResponse.json({ ok: true });
}
