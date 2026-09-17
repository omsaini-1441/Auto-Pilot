import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fillPlaceholders, firstName, htmlToPlain } from "@/lib/placeholders";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user?.profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: jobId } = await ctx.params;
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: user.id },
    include: { contacts: true },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const templateId = body.templateId as string | undefined;
  const contactIds = (body.contactIds as string[] | undefined) ?? job.contacts.map((c) => c.id);

  let template = templateId
    ? await prisma.template.findFirst({ where: { id: templateId, userId: user.id } })
    : await prisma.template.findFirst({
        where: { userId: user.id, isDefault: true },
      });
  if (!template) {
    template = await prisma.template.findFirst({ where: { userId: user.id } });
  }
  if (!template) {
    return NextResponse.json({ error: "No template" }, { status: 400 });
  }

  const contacts = job.contacts.filter((c) => contactIds.includes(c.id));
  const profile = user.profile;
  const drafts = [];

  for (const contact of contacts) {
    const ctxMap = {
      first_name: firstName(contact.name),
      full_name: contact.name,
      email: contact.email,
      title: contact.title,
      company: job.company,
      role: job.role,
      location: job.location,
      my_name: profile.fullName,
      my_headline: profile.headline,
      my_linkedin: profile.linkedIn,
      my_portfolio: profile.portfolio,
      my_phone: profile.phone,
      my_summary: profile.summary,
      my_skills: profile.skills,
    };
    const subject = fillPlaceholders(template.subject, ctxMap);
    const bodyHtml = fillPlaceholders(template.bodyHtml, ctxMap);
    const bodyPlain = htmlToPlain(bodyHtml);
    const draft = await prisma.draft.create({
      data: {
        jobId,
        contactId: contact.id,
        templateId: template.id,
        subject,
        bodyHtml,
        bodyPlain,
        status: "ready",
      },
      include: { contact: true },
    });
    drafts.push(draft);
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { status: job.status === "outreached" ? "outreached" : "drafting" },
  });

  return NextResponse.json({ drafts });
}
