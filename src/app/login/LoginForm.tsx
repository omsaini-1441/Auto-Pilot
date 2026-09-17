"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({
  showDefaultHint = false,
  defaultEmail = "",
}: {
  showDefaultHint?: boolean;
  defaultEmail?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Invalid email or password");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="field"
          type="email"
          autoComplete="username"
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
        <input
          id="password"
          className="field"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your access password"
          required
        />
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={loading} type="submit">
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <div className="flex items-center justify-between text-xs">
        <Link href="/forgot-password" className="text-[var(--accent)] underline">
          Forgot password?
        </Link>
        {showDefaultHint ? (
          <span className="text-[var(--muted)]">Local: set SOLO_EMAIL / SOLO_PASSWORD</span>
        ) : (
          <span className="text-[var(--muted)]">Private access</span>
        )}
      </div>
    </form>
  );
}
