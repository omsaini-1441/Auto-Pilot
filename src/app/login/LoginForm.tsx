"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
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
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Wrong password");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
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
          placeholder="SOLO_PASSWORD from .env"
          required
        />
      </div>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={loading} type="submit">
        {loading ? "Signing in…" : "Enter"}
      </button>
      <p className="text-xs text-[var(--muted)]">Default password is <code>outreach</code> unless you changed .env</p>
    </form>
  );
}
