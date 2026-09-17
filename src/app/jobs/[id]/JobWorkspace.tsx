"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { apolloPeopleSearchUrl } from "@/lib/apollo";
import { copyRich, copyText } from "@/lib/clipboard";
import { gmailComposeUrl } from "@/lib/gmail";
import { fillPlaceholders, firstName, htmlToPlain } from "@/lib/placeholders";

type Contact = { id: string; name: string; email: string; title: string };
type Draft = {
  id: string;
  subject: string;
  bodyHtml: string;
  bodyPlain: string;
  status: string;
  contact: Contact;
};
type Template = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  isDefault: boolean;
};
type ApolloAccount = { id: string; label: string; loginHint: string; isActive: boolean } | null;
type ProfileBits = { fullName: string; headline: string; linkedIn: string; portfolio: string; phone: string; summary: string; skills: string };
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

export function JobWorkspace({
  job: initial,
  templates: initialTemplates,
  apollo,
  profile,
}: {
  job: Job;
  templates: Template[];
  apollo: ApolloAccount;
  profile: ProfileBits;
}) {
  const router = useRouter();
  const [job, setJob] = useState(initial);
  const [templates, setTemplates] = useState(initialTemplates);
  const [dump, setDump] = useState("");
  const [templateId, setTemplateId] = useState(
    initialTemplates.find((t) => t.isDefault)?.id || initialTemplates[0]?.id || "",
  );
  const [selected, setSelected] = useState<string[]>(initial.contacts.map((c) => c.id));
  const [previewContactId, setPreviewContactId] = useState(initial.contacts[0]?.id || "");
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");

  const template = templates.find((t) => t.id === templateId) || null;
  const outreached = job.status === "outreached";

  const preview = useMemo(() => {
    if (!template) return null;
    const contact = job.contacts.find((c) => c.id === previewContactId) || job.contacts[0];
    const ctx = {
      first_name: contact ? firstName(contact.name) : "Alex",
      full_name: contact?.name || "Alex Example",
      email: contact?.email || "alex@example.com",
      title: contact?.title || "Recruiter",
      company: job.company,
      role: job.role,
      location: job.location,
      my_name: profile.fullName,
      my_headline: profile.headline,
      my_linkedin: profile.linkedIn,
      my_portfolio: profile.portfolio,
      my_phone: profile.phone,
      my_summary: profile.summary,
      my_skills: profile.skills,
    };
    const subject = fillPlaceholders(template.subject, ctx);
    const bodyHtml = fillPlaceholders(template.bodyHtml, ctx);
    return { subject, bodyHtml, bodyPlain: htmlToPlain(bodyHtml), contact };
  }, [template, previewContactId, job, profile]);

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
    if (!data.job.contacts.find((c: Contact) => c.id === previewContactId)) {
      setPreviewContactId(data.job.contacts[0]?.id || "");
    }
    router.refresh();
  }

  async function reloadTemplates() {
    const res = await fetch("/api/templates");
    const data = await res.json();
    setTemplates(data.templates);
    if (!data.templates.find((t: Template) => t.id === templateId) && data.templates[0]) {
      setTemplateId(data.templates[0].id);
    }
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
    flash(`Drafts ready for ${selected.length} people`);
  }

  async function generateAiTemplate() {
    setBusy("ai");
    const res = await fetch("/api/templates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: job.company,
        role: job.role,
        location: job.location,
        notes: job.notes,
        save: true,
      }),
    });
    const data = await res.json();
    setBusy("");
    if (!res.ok) {
      flash("AI template failed");
      return;
    }
    await reloadTemplates();
    if (data.template?.id) setTemplateId(data.template.id);
    flash("AI template saved — preview below");
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

  async function toggleOutreached() {
    const next = outreached ? "researching" : "outreached";
    await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await refresh();
  }

  function openApollo() {
    const url = apolloPeopleSearchUrl(job.company);
    window.open(url, "_blank");
    flash(
      apollo
        ? `Use Apollo as: ${apollo.label}${apollo.loginHint ? ` (${apollo.loginHint})` : ""}`
        : "Opened Apollo — set an active account under Apollo tab",
    );
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
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <button
              type="button"
              role="switch"
              aria-checked={outreached}
              onClick={toggleOutreached}
              className={`relative h-7 w-12 rounded-full transition ${
                outreached ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  outreached ? "translate-x-5" : ""
                }`}
              />
            </button>
            <span>{outreached ? "Outreached" : "Not outreached"}</span>
          </label>
          {job.sourceUrl ? (
            <a href={job.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent)] underline">
              Source link
            </a>
          ) : null}
        </div>
      </div>

      <section className="card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-semibold">Find people (Apollo)</h2>
            <p className="text-xs text-[var(--muted)]">
              Opens people search for <strong>{job.company || "this company"}</strong> in a new tab.
              {apollo ? (
                <>
                  {" "}
                  Active login: <strong>{apollo.label}</strong>
                  {apollo.loginHint ? ` · ${apollo.loginHint}` : ""}
                </>
              ) : (
                <>
                  {" "}
                  <Link href="/apollo" className="underline">
                    Add Apollo accounts
                  </Link>{" "}
                  to rotate free logins.
                </>
              )}
            </p>
          </div>
        </div>
        <button type="button" className="btn btn-accent w-full" onClick={openApollo}>
          Open Apollo search
        </button>
      </section>

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
            <li className="flex items-center gap-2 py-2 text-xs text-[var(--muted)]">
              <button
                type="button"
                className="underline"
                onClick={() => setSelected(job.contacts.map((c) => c.id))}
              >
                Select all
              </button>
              <button type="button" className="underline" onClick={() => setSelected([])}>
                Clear
              </button>
            </li>
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
        <h2 className="font-semibold">2. Template &amp; preview</h2>
        <p className="text-xs text-[var(--muted)]">
          Use <code>[person name]</code>, <code>[company name]</code>, <code>[role]</code>, <code>[my name]</code> in
          templates. Selecting 3–4 people creates a filled draft for each.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-ghost text-sm" onClick={generateAiTemplate} disabled={busy === "ai"}>
            {busy === "ai" ? "Writing…" : "AI create template"}
          </button>
          <Link href="/templates" className="btn btn-ghost text-sm text-center">
            Edit templates
          </Link>
        </div>
        {templates.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No saved templates yet — create one or use AI.</p>
        ) : (
          <>
            <label className="label" htmlFor="template">
              Saved template
            </label>
            <select id="template" className="field" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
            {job.contacts.length > 0 ? (
              <>
                <label className="label" htmlFor="previewPerson">
                  Preview as
                </label>
                <select
                  id="previewPerson"
                  className="field"
                  value={previewContactId}
                  onChange={(e) => setPreviewContactId(e.target.value)}
                >
                  {job.contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            {preview ? (
              <div className="rounded-md border border-[var(--border)] bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Live preview</p>
                <p className="mt-1 text-sm font-semibold">{preview.subject}</p>
                <div
                  className="prose prose-sm mt-2 max-w-none text-[15px]"
                  dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
                />
              </div>
            ) : null}
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={!selected.length || busy === "drafts" || !template}
              onClick={generateDrafts}
            >
              {busy === "drafts" ? "Generating…" : `Apply to ${selected.length || 0} selected`}
            </button>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">3. Copy → Gmail</h2>
        {job.drafts.length === 0 ? (
          <div className="card text-sm text-[var(--muted)]">Drafts will show here after you apply a template.</div>
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
