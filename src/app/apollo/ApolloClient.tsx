"use client";

import { useState } from "react";
import { apolloHomeUrl } from "@/lib/apollo";
import { BusyButton } from "@/components/ui/BusyButton";
import { Spinner } from "@/components/ui/Spinner";

type Account = {
  id: string;
  label: string;
  loginHint: string;
  notes: string;
  isActive: boolean;
};

export function ApolloClient({ initial }: { initial: Account[] }) {
  const [accounts, setAccounts] = useState(initial);
  const [label, setLabel] = useState("");
  const [loginHint, setLoginHint] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState("");

  async function reload() {
    const res = await fetch("/api/apollo");
    const data = await res.json();
    setAccounts(data.accounts);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy("add");
    try {
      await fetch("/api/apollo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, loginHint, notes }),
      });
      setLabel("");
      setLoginHint("");
      setNotes("");
      await reload();
    } finally {
      setBusy("");
    }
  }

  async function setActive(id: string) {
    setBusy(`use:${id}`);
    try {
      await fetch(`/api/apollo/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      await reload();
    } finally {
      setBusy("");
    }
  }

  async function remove(id: string) {
    if (!confirm("Remove this Apollo account?")) return;
    setBusy(`del:${id}`);
    try {
      await fetch(`/api/apollo/${id}`, { method: "DELETE" });
      await reload();
    } finally {
      setBusy("");
    }
  }

  const active = accounts.find((a) => a.isActive);
  const anyBusy = Boolean(busy);

  return (
    <div className="space-y-5">
      <div className="lg:max-w-3xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Apollo</h1>
        <p className="text-sm text-[var(--muted)]">
          Rotate free Apollo logins here. We open people search in a new tab — no paid API required.
          (People API search is free but doesn&apos;t return emails; enrichment burns credits.)
        </p>
      </div>

      <div className="card space-y-2 lg:flex lg:items-center lg:justify-between lg:gap-6">
        <p className="text-sm">
          Active account:{" "}
          <strong>{active ? active.label : "None selected"}</strong>
          {active?.loginHint ? ` · login as ${active.loginHint}` : ""}
        </p>
        <button
          type="button"
          className="btn btn-accent w-full lg:w-auto lg:shrink-0"
          onClick={() => window.open(apolloHomeUrl(), "_blank")}
        >
          Open Apollo people search
        </button>
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)] lg:items-start lg:gap-5 lg:space-y-0">
        <ul className="space-y-2">
          {accounts.length === 0 ? (
            <li className="card text-sm text-[var(--muted)]">No accounts yet — add one on the right.</li>
          ) : null}
          {accounts.map((a) => {
            const using = busy === `use:${a.id}`;
            const deleting = busy === `del:${a.id}`;
            return (
              <li key={a.id} className="card flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {a.label}
                    {a.isActive ? (
                      <span className="ml-2 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--accent)]">
                        active
                      </span>
                    ) : null}
                  </p>
                  {a.loginHint ? <p className="text-sm text-[var(--muted)]">{a.loginHint}</p> : null}
                  {a.notes ? <p className="text-xs text-[var(--muted)]">{a.notes}</p> : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {!a.isActive ? (
                    <BusyButton
                      className="btn btn-ghost text-xs px-2 py-1"
                      busy={using}
                      busyLabel="…"
                      disabled={anyBusy && !using}
                      onClick={() => setActive(a.id)}
                    >
                      Use
                    </BusyButton>
                  ) : null}
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-[var(--danger)] underline disabled:opacity-55"
                    disabled={anyBusy}
                    onClick={() => remove(a.id)}
                  >
                    {deleting ? <Spinner size="sm" className="text-[var(--danger)]" /> : null}
                    {deleting ? "Removing…" : "Remove"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <form onSubmit={add} className="card space-y-3 desktop-sticky">
          <h2 className="font-semibold">Add Apollo account</h2>
          <div>
            <label className="label">Label</label>
            <input className="field" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Work Gmail / Uni mail" required />
          </div>
          <div>
            <label className="label">Login hint</label>
            <input className="field" value={loginHint} onChange={(e) => setLoginHint(e.target.value)} placeholder="you@company.com" />
          </div>
          <div>
            <label className="label">Notes</label>
            <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="credits left, etc." />
          </div>
          <BusyButton
            className="btn btn-primary w-full"
            type="submit"
            busy={busy === "add"}
            busyLabel="Saving…"
            disabled={!label.trim() || (anyBusy && busy !== "add")}
          >
            Save account
          </BusyButton>
        </form>
      </div>
    </div>
  );
}
