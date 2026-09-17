import { redirect } from "next/navigation";
import { getSessionUser, loginPageHints } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  const hints = loginPageHints();

  return (
    <div className="flex min-h-[70vh] flex-col justify-center gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Private</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--ink)]">
          Sign in
        </h1>
        <p className="mt-2 max-w-sm text-[var(--muted)]">Use your account email and password to continue.</p>
      </div>
      <LoginForm showDefaultHint={hints.showDefaultHint} defaultEmail={hints.defaultEmail} />
    </div>
  );
}
