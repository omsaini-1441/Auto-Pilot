"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BusyButton } from "@/components/ui/BusyButton";
import { PasswordField } from "@/components/ui/PasswordField";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not create account");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not create account");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md min-h-[70vh] flex-col justify-center gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-(--muted)">Account</p>
        <h1 className="mt-2 font-(family-name:--font-display) text-4xl leading-tight text-(--ink)">
          Create account
        </h1>
        <p className="mt-2 max-w-sm text-(--muted)">
          Sign up with your email. Password must be at least 12 characters.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="field"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <PasswordField
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 12 characters"
            minLength={12}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="confirm">
            Confirm password
          </label>
          <PasswordField
            id="confirm"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
            minLength={12}
            required
          />
        </div>
        {error ? <p className="text-sm text-(--danger)">{error}</p> : null}
        <BusyButton className="btn btn-primary w-full" type="submit" busy={loading} busyLabel="Creating…">
          Create account
        </BusyButton>
        <p className="text-center text-xs text-(--muted)">
          Already have an account?{" "}
          <Link href="/login" className="text-(--accent) underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
