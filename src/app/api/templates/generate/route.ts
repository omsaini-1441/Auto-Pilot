import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { generateOutreachTemplate } from "@/lib/gemini";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user?.profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const save = body.save !== false;

  const generated = await generateOutreachTemplate({
    company: body.company,
    role: body.role,
    location: body.location,
    notes: body.notes,
    myName: user.profile.fullName,
    myHeadline: user.profile.headline,
    tone: body.tone,
  });

  if (!save) {
    return NextResponse.json({ template: generated, saved: false });
  }

  const template = await prisma.template.create({
    data: {
      userId: user.id,
      name: generated.name,
      subject: generated.subject,
      bodyHtml: generated.bodyHtml,
      isDefault: false,
    },
  });

  return NextResponse.json({ template, notes: generated.notes, saved: true });
}
