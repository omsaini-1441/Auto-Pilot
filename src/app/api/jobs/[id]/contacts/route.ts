import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseContactDump } from "@/lib/parse-contacts";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const job = await prisma.job.findFirst({ where: { id, userId: user.id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  let contacts = body.contacts as { name: string; email: string; title?: string }[] | undefined;
  if (body.dump) {
    contacts = parseContactDump(String(body.dump));
  }
  if (!contacts?.length) {
    return NextResponse.json({ error: "No contacts parsed" }, { status: 400 });
  }

  await prisma.contact.createMany({
    data: contacts.map((c) => ({
      jobId: id,
      name: c.name,
      email: c.email,
      title: c.title ?? "",
    })),
  });

  const all = await prisma.contact.findMany({
    where: { jobId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ contacts: all });
}
