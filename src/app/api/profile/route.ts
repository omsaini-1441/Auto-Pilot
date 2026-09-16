import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ profile: user.profile });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      fullName: body.fullName ?? "",
      headline: body.headline ?? "",
      linkedIn: body.linkedIn ?? "",
      portfolio: body.portfolio ?? "",
      phone: body.phone ?? "",
      summary: body.summary ?? "",
      skills: body.skills ?? "",
      autofillJson: body.autofillJson ?? "{}",
    },
    update: {
      fullName: body.fullName ?? "",
      headline: body.headline ?? "",
      linkedIn: body.linkedIn ?? "",
      portfolio: body.portfolio ?? "",
      phone: body.phone ?? "",
      summary: body.summary ?? "",
      skills: body.skills ?? "",
      autofillJson: body.autofillJson ?? undefined,
    },
  });
  return NextResponse.json({ profile });
}
