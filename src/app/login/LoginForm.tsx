"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BusyButton } from "@/components/ui/BusyButton";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Invalid email or password");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Could not sign in");
      setLoading(false);
    }
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
        <div className="relative">
          <input
            id="password"
            className="field pr-16"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
          />
          <button
            type="button"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <BusyButton className="btn btn-primary w-full" type="submit" busy={loading} busyLabel="Signing in…">
        Sign in
      </BusyButton>
      <div className="flex items-center justify-between gap-3 text-xs">
        <Link href="/forgot-password" className="text-[var(--accent)] underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-[var(--accent)] underline">
          Create account
        </Link>
      </div>
    </form>
  );
}
