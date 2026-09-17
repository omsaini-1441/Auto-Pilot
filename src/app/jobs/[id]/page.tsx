import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { apolloAccounts, prisma } from "@/lib/db";
import { JobWorkspace } from "./JobWorkspace";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function JobPage({ params }: Props) {
  const user = await getSessionUser();
  if (!user?.profile) redirect("/login");
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

  const apollo = await apolloAccounts.findFirst({
    where: { userId: user.id, isActive: true },
  });

  return (
    <JobWorkspace
      job={JSON.parse(JSON.stringify(job))}
      templates={JSON.parse(JSON.stringify(templates))}
      apollo={apollo ? JSON.parse(JSON.stringify(apollo)) : null}
      profile={JSON.parse(JSON.stringify(user.profile))}
    />
  );
}
