import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return (
    <div className="flex min-h-[70vh] flex-col justify-center gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Solo tool</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--ink)]">
          Outreach
        </h1>
        <p className="mt-2 max-w-sm text-[var(--muted)]">
          Capture a job, dump contacts, rich-copy drafts into Gmail — built for phone use.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
