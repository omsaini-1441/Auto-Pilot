import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { JobWorkspace } from "./JobWorkspace";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function JobPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: { id, userId: user.id },
    include: {
      contacts: { orderBy: { createdAt: "asc" } },
      drafts: {
        orderBy: { updatedAt: "desc" },
        include: { contact: true },
      },
    },
  });
  if (!job) notFound();

  const templates = await prisma.template.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return <JobWorkspace job={JSON.parse(JSON.stringify(job))} templates={JSON.parse(JSON.stringify(templates))} />;
}
