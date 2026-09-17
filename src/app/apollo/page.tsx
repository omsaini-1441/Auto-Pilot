import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { apolloAccounts } from "@/lib/db";
import { ApolloClient } from "./ApolloClient";

export const dynamic = "force-dynamic";

export default async function ApolloPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const accounts = await apolloAccounts.findMany({
    where: { userId: user.id },
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
  });
  return <ApolloClient initial={JSON.parse(JSON.stringify(accounts))} />;
}
