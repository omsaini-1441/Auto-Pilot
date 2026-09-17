import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const draft = await prisma.draft.findFirst({
    where: { id, job: { userId: user.id } },
  });
  if (!draft) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const updated = await prisma.draft.update({
    where: { id },
    data: { status: body.status ?? draft.status },
    include: { contact: true, job: true },
  });

  return NextResponse.json({ draft: updated });
}
