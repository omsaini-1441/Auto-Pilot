"use client";

import Link from "next/link";
import { useState } from "react";
import { BusyButton } from "@/components/ui/BusyButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [devLink, setDevLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    setDevLink("");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Request failed");
        return;
      }
      setMsg(data.message || "If that email is registered, a reset link has been sent.");
      if (typeof data.devResetUrl === "string") setDevLink(data.devResetUrl);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md min-h-[70vh] flex-col justify-center gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-(--muted)">Account</p>
        <h1 className="mt-2 font-(family-name:--font-display) text-4xl leading-tight">Forgot password</h1>
        <p className="mt-2 max-w-sm text-(--muted)">
          Enter your account email. We&apos;ll send a reset link if it matches.
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
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-(--danger)">{error}</p> : null}
        {msg ? <p className="text-sm text-(--accent)">{msg}</p> : null}
        {devLink ? (
          <p className="break-all text-xs text-(--muted)">
            Dev reset link:{" "}
            <Link href={devLink} className="text-(--accent) underline">
              {devLink}
            </Link>
          </p>
        ) : null}
        <BusyButton className="btn btn-primary w-full" type="submit" busy={loading} busyLabel="Sending…">
          Send reset link
        </BusyButton>
        <Link href="/login" className="block text-center text-sm text-(--accent) underline">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
