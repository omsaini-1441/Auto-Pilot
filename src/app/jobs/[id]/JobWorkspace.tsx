"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { copyRich, copyText } from "@/lib/clipboard";
import { gmailComposeUrl } from "@/lib/gmail";

type Contact = { id: string; name: string; email: string; title: string };
type Draft = {
  id: string;
  subject: string;
  bodyHtml: string;
  bodyPlain: string;
  status: string;
  contact: Contact;
};
type Template = { id: string; name: string; isDefault: boolean };
type Job = {
  id: string;
  company: string;
  role: string;
  location: string;
  status: string;
  sourceUrl: string;
  notes: string;
  contacts: Contact[];
  drafts: Draft[];
};

export function JobWorkspace({ job: initial, templates }: { job: Job; templates: Template[] }) {
  const router = useRouter();
  const [job, setJob] = useState(initial);
  const [dump, setDump] = useState("");
  const [templateId, setTemplateId] = useState(templates.find((t) => t.isDefault)?.id || templates[0]?.id || "");
  const [selected, setSelected] = useState<string[]>(initial.contacts.map((c) => c.id));
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function refresh() {
    const res = await fetch(`/api/jobs/${job.id}`);
    const data = await res.json();
    setJob(data.job);
    setSelected((prev) => {
      const ids = new Set(data.job.contacts.map((c: Contact) => c.id));
      const kept = prev.filter((id) => ids.has(id));
      return kept.length ? kept : data.job.contacts.map((c: Contact) => c.id);
    });
    router.refresh();
  }

  async function addContacts() {
    setBusy("contacts");
    const res = await fetch(`/api/jobs/${job.id}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dump }),
    });
    setBusy("");
    if (!res.ok) {
      flash("Could not parse contacts");
      return;
    }
    setDump("");
    await refresh();
    flash("Contacts added");
  }

  async function generateDrafts() {
    setBusy("drafts");
    const res = await fetch(`/api/jobs/${job.id}/drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateId, contactIds: selected }),
    });
    setBusy("");
    if (!res.ok) {
      flash("Draft generation failed — check templates/profile");
      return;
    }
    await refresh();
    flash("Drafts ready");
  }

  async function markDraft(id: string, status: string) {
    await fetch(`/api/drafts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await refresh();
  }

  async function onRichCopy(draft: Draft) {
    const result = await copyRich(draft.bodyHtml, draft.bodyPlain);
    if (result.ok) {
      await markDraft(draft.id, "copied");
      flash(result.mode === "rich" ? "Rich copy ready — paste in Gmail" : "Plain text copied");
    } else {
      flash("Copy failed — long-press select in preview");
    }
  }

  async function onCopySubject(draft: Draft) {
    const ok = await copyText(draft.subject);
    flash(ok ? "Subject copied" : "Could not copy subject");
  }

  async function openGmail(draft: Draft) {
    await markDraft(draft.id, "opened");
    window.open(gmailComposeUrl({ to: draft.contact.email, subject: draft.subject }), "_blank");
  }

  async function updateStatus(status: string) {
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/" className="text-sm text-[var(--muted)]">
          ← Jobs
        </Link>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl">{job.company || "Job"}</h1>
        <p className="text-[var(--muted)]">
          {job.role || "Role TBD"}
          {job.location ? ` · ${job.location}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
            {job.status}
          </span>
          {job.sourceUrl ? (
            <a href={job.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent)] underline">
              Source link
            </a>
          ) : null}
          <button type="button" className="text-xs underline text-[var(--muted)]" onClick={() => updateStatus("outreached")}>
            Mark outreached
          </button>
        </div>
      </div>

      <section className="card space-y-3">
        <h2 className="font-semibold">1. Dump contacts</h2>
        <p className="text-xs text-[var(--muted)]">
          One per line: <code>Name, email@x.com, Title</code> or <code>Name &lt;email@x.com&gt;</code>
        </p>
        <textarea
          className="field min-h-[100px] font-mono text-sm"
          value={dump}
          onChange={(e) => setDump(e.target.value)}
          placeholder={"Jane Doe, jane@acme.com, Recruiter\nSam Lee <sam@acme.com>"}
        />
        <button type="button" className="btn btn-ghost w-full" disabled={!dump.trim() || busy === "contacts"} onClick={addContacts}>
          {busy === "contacts" ? "Adding…" : "Add contacts"}
        </button>
        {job.contacts.length > 0 ? (
          <ul className="divide-y divide-[var(--border)]">
            {job.contacts.map((c) => (
              <li key={c.id} className="flex items-center gap-2 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(c.id)}
                  onChange={(e) =>
                    setSelected((prev) => (e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)))
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {c.email}
                    {c.title ? ` · ${c.title}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">2. Generate drafts</h2>
        {templates.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No templates yet. <Link href="/templates" className="underline">Create one</Link>.
          </p>
        ) : (
          <>
            <label className="label" htmlFor="template">
              Template
            </label>
            <select
              id="template"
              className="field"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={!selected.length || busy === "drafts"}
              onClick={generateDrafts}
            >
              {busy === "drafts" ? "Generating…" : `Create drafts (${selected.length})`}
            </button>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">3. Copy → Gmail</h2>
        {job.drafts.length === 0 ? (
          <div className="card text-sm text-[var(--muted)]">Drafts will show here after generation.</div>
        ) : (
          job.drafts.map((draft) => (
            <article key={draft.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{draft.contact.name}</p>
                  <p className="text-xs text-[var(--muted)]">{draft.contact.email}</p>
                </div>
                <span className="text-xs text-[var(--muted)]">{draft.status}</span>
              </div>
              <p className="text-sm font-semibold">{draft.subject}</p>
              <div
                className="prose prose-sm max-w-none rounded-md border border-[var(--border)] bg-white p-3 text-[15px]"
                dangerouslySetInnerHTML={{ __html: draft.bodyHtml }}
              />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn btn-accent" onClick={() => onRichCopy(draft)}>
                  Rich copy
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => onCopySubject(draft)}>
                  Copy subject
                </button>
                <button type="button" className="btn btn-ghost col-span-2" onClick={() => openGmail(draft)}>
                  Open Gmail compose
                </button>
                <button
                  type="button"
                  className="btn btn-ghost col-span-2 text-sm"
                  onClick={() => markDraft(draft.id, "sent_manual")}
                >
                  Mark sent manually
                </button>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Tip: Rich copy → open Gmail → paste body. Formatting stays for bold/lists/links.
              </p>
            </article>
          ))
        )}
      </section>

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-lg bg-[var(--ink)] px-4 py-3 text-center text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
