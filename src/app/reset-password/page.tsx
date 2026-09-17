"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BusyButton } from "@/components/ui/BusyButton";
import { FormCardSkeleton } from "@/components/ui/Skeleton";
import { Spinner } from "@/components/ui/Spinner";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Reset failed");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Reset failed");
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="card space-y-3">
        <p className="text-sm text-[var(--danger)]">Missing reset token. Request a new link.</p>
        <Link href="/forgot-password" className="text-sm text-[var(--accent)] underline">
          Forgot password
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          className="field"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={12}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="confirm">
          Confirm password
        </label>
        <input
          id="confirm"
          className="field"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={12}
          required
        />
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <BusyButton className="btn btn-primary w-full" type="submit" busy={loading} busyLabel="Updating…">
        Update password & sign in
      </BusyButton>
      <Link href="/login" className="block text-center text-sm text-[var(--accent)] underline">
        Back to sign in
      </Link>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[70vh] flex-col justify-center gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--muted)]">Account</p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl leading-tight">Reset password</h1>
        <p className="mt-2 max-w-sm text-[var(--muted)]">Choose a new password (at least 12 characters).</p>
      </div>
      <Suspense
        fallback={
          <div className="relative">
            <FormCardSkeleton fields={2} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner size="md" label="Loading form" />
            </div>
          </div>
        }
      >
        <ResetForm />
      </Suspense>
    </div>
  );
}
