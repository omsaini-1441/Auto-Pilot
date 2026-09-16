import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const templates = await prisma.template.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json({ templates });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body.isDefault) {
    await prisma.template.updateMany({
      where: { userId: user.id },
      data: { isDefault: false },
    });
  }
  const template = await prisma.template.create({
    data: {
      userId: user.id,
      name: body.name || "Untitled",
      subject: body.subject || "",
      bodyHtml: body.bodyHtml || "<p></p>",
      isDefault: !!body.isDefault,
    },
  });
  return NextResponse.json({ template });
}
