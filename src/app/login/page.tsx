import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-md min-h-[70vh] flex-col justify-center gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-(--muted)">Account</p>
        <h1 className="mt-2 font-(family-name:--font-display) text-4xl leading-tight text-(--ink)">
          Sign in
        </h1>
        <p className="mt-2 max-w-sm text-(--muted)">Use your email and password to continue.</p>
      </div>
      <LoginForm />
    </div>
  );
}
