import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TemplatesClient } from "./TemplatesClient";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const templates = await prisma.template.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  return <TemplatesClient initial={JSON.parse(JSON.stringify(templates))} />;
}
