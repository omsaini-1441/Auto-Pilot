"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BusyButton } from "@/components/ui/BusyButton";
import { Spinner } from "@/components/ui/Spinner";
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
  updatedAt?: string;
};
type Template = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  isDefault: boolean;
};
type ApolloAccount = { id: string; label: string; loginHint: string; isActive: boolean } | null;
type ProfileBits = {
  fullName: string;
  headline: string;
  linkedIn: string;
  portfolio: string;
  phone: string;
  summary: string;
  skills: string;
};
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

type Step = 1 | 2 | 3;

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
  const [step, setStep] = useState<Step>(job.contacts.length ? 2 : 1);
  const [dump, setDump] = useState("");
  const [templateId, setTemplateId] = useState(
    initialTemplates.find((t) => t.isDefault)?.id || initialTemplates[0]?.id || "",
  );
  const [selected, setSelected] = useState<string[]>(initial.contacts.map((c) => c.id));
  const [activePersonId, setActivePersonId] = useState(initial.contacts[0]?.id || "");
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");

  const template = templates.find((t) => t.id === templateId) || null;
  const outreached = job.status === "outreached";
  const profileMissing = !profile.fullName?.trim();

  const latestDrafts = useMemo(() => {
    const map = new Map<string, Draft>();
    for (const d of job.drafts) {
      const prev = map.get(d.contact.id);
      if (!prev) map.set(d.contact.id, d);
    }
    return selected
      .map((id) => map.get(id))
      .filter((d): d is Draft => Boolean(d));
  }, [job.drafts, selected]);

  const activeDraft =
    latestDrafts.find((d) => d.contact.id === activePersonId) || latestDrafts[0] || null;

  const livePreview = useMemo(() => {
    if (!template) return null;
    const contact =
      job.contacts.find((c) => c.id === activePersonId) ||
      job.contacts.find((c) => selected.includes(c.id)) ||
      job.contacts[0];
    if (!contact) return null;
    const ctx = {
      first_name: firstName(contact.name),
      full_name: contact.name,
      email: contact.email,
      title: contact.title,
      company: job.company,
      role: job.role,
      location: job.location,
      my_name: profile.fullName || "",
      my_headline: profile.headline || "",
      my_linkedin: profile.linkedIn || "",
      my_portfolio: profile.portfolio || "",
      my_phone: profile.phone || "",
      my_summary: profile.summary || "",
      my_skills: profile.skills || "",
    };
    return {
      contact,
      subject: fillPlaceholders(template.subject, ctx),
      bodyHtml: fillPlaceholders(template.bodyHtml, ctx),
      bodyPlain: htmlToPlain(fillPlaceholders(template.bodyHtml, ctx)),
    };
  }, [template, activePersonId, selected, job, profile]);

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
    if (!data.job.contacts.find((c: Contact) => c.id === activePersonId)) {
      setActivePersonId(data.job.contacts[0]?.id || "");
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
    try {
      const res = await fetch(`/api/jobs/${job.id}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dump }),
      });
      if (!res.ok) {
        flash("Could not parse contacts");
        return;
      }
      setDump("");
      await refresh();
      flash("Contacts added");
    } finally {
      setBusy("");
    }
  }

  async function generateDrafts() {
    if (!selected.length) {
      flash("Select at least one contact");
      return;
    }
    if (profileMissing) {
      flash("Add your name in Profile first");
      return;
    }
    setBusy("drafts");
    try {
      const res = await fetch(`/api/jobs/${job.id}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, contactIds: selected }),
      });
      if (!res.ok) {
        flash("Could not build drafts");
        return;
      }
      await refresh();
      setActivePersonId(selected[0]);
      setStep(3);
      flash(`Ready for ${selected.length} people`);
    } finally {
      setBusy("");
    }
  }

  async function generateAiTemplate() {
    setBusy("ai");
    try {
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
      if (!res.ok) {
        flash("AI template failed");
        return;
      }
      await reloadTemplates();
      if (data.template?.id) setTemplateId(data.template.id);
      flash("Template saved");
    } finally {
      setBusy("");
    }
  }

  async function markDraft(id: string, status: string) {
    setBusy(`draft:${status}:${id}`);
    try {
      await fetch(`/api/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await refresh();
    } finally {
      setBusy("");
    }
  }

  async function onRichCopy(draft: Draft) {
    setBusy(`copy:${draft.id}`);
    try {
      const result = await copyRich(draft.bodyHtml, draft.bodyPlain);
      if (result.ok) {
        await fetch(`/api/drafts/${draft.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "copied" }),
        });
        await refresh();
        flash(result.mode === "rich" ? "Copied — paste in Gmail" : "Plain text copied");
      } else {
        flash("Copy failed");
      }
    } finally {
      setBusy("");
    }
  }

  async function onGmail(draft: Draft) {
    setBusy(`gmail:${draft.id}`);
    try {
      await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "opened" }),
      });
      window.open(
        gmailComposeUrl({
          to: draft.contact.email,
          subject: draft.subject,
        }),
        "_blank",
      );
      await refresh();
    } finally {
      setBusy("");
    }
  }

  async function toggleOutreached() {
    if (busy === "outreached") return;
    const next = outreached ? "researching" : "outreached";
    setBusy("outreached");
    try {
      await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      await refresh();
    } finally {
      setBusy("");
    }
  }

  function openApollo() {
    window.open(apolloPeopleSearchUrl(job.company), "_blank");
    flash(apollo ? `Use Apollo as ${apollo.label}` : "Opened Apollo");
  }

  function toggleContact(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setActivePersonId(id);
  }

  const steps: { id: Step; label: string }[] = [
    { id: 1, label: "People" },
    { id: 2, label: "Template" },
    { id: 3, label: "Send" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Link href="/" className="text-sm text-()">
          ← Jobs
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-(family-name:--font-display) text-3xl leading-tight lg:text-4xl">
              {job.company || "Job"}
            </h1>
            <p className="text-sm text-()">
              {job.role || "Role TBD"}
              {job.location ? ` · ${job.location}` : ""}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={outreached}
            aria-busy={busy === "outreached" || undefined}
            disabled={busy === "outreached"}
            onClick={toggleOutreached}
            className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${
              outreached ? "bg-()" : "bg-()"
            } ${busy === "outreached" ? "switch-busy" : ""}`}
            title="Outreached"
          >
            {busy === "outreached" ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner size="sm" className="text-()" />
              </span>
            ) : (
              <span
                className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  outreached ? "translate-x-5" : ""
                }`}
              />
            )}
          </button>
        </div>
      </div>

      <nav className="stepper" aria-label="Workflow steps">
        {steps.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`stepper-item ${step === s.id ? "is-active" : ""} ${step > s.id ? "is-done" : ""}`}
            onClick={() => setStep(s.id)}
          >
            <span className="stepper-num">{i + 1}</span>
            <span className="stepper-label">{s.label}</span>
          </button>
        ))}
      </nav>

      {step === 1 ? (
        <section className="panel space-y-4">
          <header className="panel-head">
            <div>
              <h2>People</h2>
              <p>Find emails in Apollo, then dump and select who to write to.</p>
            </div>
            <button type="button" className="btn btn-ghost text-sm px-3 py-2" onClick={openApollo}>
              Apollo
            </button>
          </header>

          <div className="space-y-4 desktop-split">
            <div className="space-y-4">
              <textarea
                className="field min-h-[88px] font-mono text-sm lg:min-h-[140px]"
                value={dump}
                onChange={(e) => setDump(e.target.value)}
                placeholder={"Jane Doe, jane@acme.com, Recruiter\nSam Lee <sam@acme.com>"}
              />
              <BusyButton
                type="button"
                className="btn btn-ghost w-full"
                disabled={!dump.trim()}
                busy={busy === "contacts"}
                busyLabel="Adding…"
                onClick={addContacts}
              >
                Add to list
              </BusyButton>
            </div>

            <div>
              {job.contacts.length === 0 ? (
                <p className="empty-hint lg:rounded-xl lg:border lg:border-dashed lg:border-() lg:py-10">
                  No contacts yet. Paste a dump above.
                </p>
              ) : (
                <div className="contact-list lg:max-h-[28rem] lg:overflow-y-auto">
                  <div className="contact-list-toolbar">
                    <span>{selected.length} selected</span>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setSelected(job.contacts.map((c) => c.id))}>
                        All
                      </button>
                      <button type="button" onClick={() => setSelected([])}>
                        None
                      </button>
                    </div>
                  </div>
                  <ul>
                    {job.contacts.map((c) => {
                      const on = selected.includes(c.id);
                      return (
                        <li key={c.id}>
                          <button
                            type="button"
                            className={`contact-row ${on ? "is-on" : ""}`}
                            onClick={() => toggleContact(c.id)}
                          >
                            <span className={`toggle-dot ${on ? "is-on" : ""}`} aria-hidden />
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block truncate font-medium">{c.name}</span>
                              <span className="block truncate text-xs text-()">
                                {c.email}
                                {c.title ? ` · ${c.title}` : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary w-full lg:max-w-xs"
            disabled={!selected.length}
            onClick={() => setStep(2)}
          >
            Continue to template
          </button>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="panel space-y-4">
          <header className="panel-head">
            <div>
              <h2>Template</h2>
              <p>Pick a saved template. Preview fills for the highlighted person.</p>
            </div>
          </header>

          {profileMissing ? (
            <div className="banner-warn">
              Your profile name is empty — <Link href="/profile">set it on Me</Link> so [my name] fills.
            </div>
          ) : null}

          <div className="space-y-4 desktop-split">
            <div className="space-y-4">
              <div className="flex gap-2">
                <BusyButton
                  type="button"
                  className="btn btn-ghost flex-1 text-sm"
                  onClick={generateAiTemplate}
                  busy={busy === "ai"}
                  busyLabel="Writing…"
                >
                  AI draft
                </BusyButton>
                <Link href="/templates" className="btn btn-ghost flex-1 text-center text-sm">
                  Edit templates
                </Link>
              </div>

              {templates.length === 0 ? (
                <p className="empty-hint">No templates yet. Create one or use AI draft.</p>
              ) : (
                <>
                  <div>
                    <label className="label" htmlFor="template">
                      Template
                    </label>
                    <select id="template" className="field" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                          {t.isDefault ? " · default" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selected.length > 0 ? (
                    <div className="person-chips">
                      {selected.map((id) => {
                        const c = job.contacts.find((x) => x.id === id);
                        if (!c) return null;
                        return (
                          <button
                            key={id}
                            type="button"
                            className={`person-chip ${activePersonId === id ? "is-active" : ""}`}
                            onClick={() => setActivePersonId(id)}
                          >
                            {c.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="empty-hint">Go back and select contacts first.</p>
                  )}
                </>
              )}

              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setStep(1)}>
                  Back
                </button>
                <BusyButton
                  type="button"
                  className="btn btn-primary flex-1"
                  disabled={!selected.length || !template}
                  busy={busy === "drafts"}
                  busyLabel="Building…"
                  onClick={generateDrafts}
                >
                  {`Build for ${selected.length}`}
                </BusyButton>
              </div>
            </div>

            <div className="desktop-sticky">
              {livePreview ? (
                <article className="mail-preview">
                  <p className="mail-preview-meta">Preview · {livePreview.contact.name}</p>
                  <h3>{livePreview.subject}</h3>
                  <div
                    className="mail-preview-body"
                    dangerouslySetInnerHTML={{ __html: livePreview.bodyHtml }}
                  />
                </article>
              ) : templates.length > 0 ? (
                <p className="empty-hint lg:rounded-xl lg:border lg:border-dashed lg:border-() lg:py-10">
                  Select a contact to preview the email.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="panel space-y-4">
          <header className="panel-head">
            <div>
              <h2>Send</h2>
              <p>One draft per selected person. Copy, open Gmail, send yourself.</p>
            </div>
          </header>

          {latestDrafts.length === 0 ? (
            <p className="empty-hint">No drafts yet. Build them from the Template step.</p>
          ) : (
            <div className="space-y-4 desktop-split">
              <div className="space-y-4">
                <div className="person-chips lg:flex lg:flex-col lg:items-stretch lg:gap-2 lg:overflow-visible">
                  {latestDrafts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`person-chip lg:flex lg:w-full lg:items-center lg:justify-between lg:rounded-lg lg:px-3 lg:py-2.5 ${
                        activeDraft?.id === d.id ? "is-active" : ""
                      }`}
                      onClick={() => setActivePersonId(d.contact.id)}
                    >
                      <span className="truncate">{d.contact.name.split(" ")[0]}</span>
                      <span className="person-chip-status hidden text-xs opacity-80 lg:inline">
                        {d.status === "ready" ? "" : d.status}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button type="button" className="btn btn-ghost flex-1" onClick={() => setStep(2)}>
                    Back
                  </button>
                  <BusyButton
                    type="button"
                    className="btn btn-primary flex-1"
                    onClick={generateDrafts}
                    busy={busy === "drafts"}
                    busyLabel="Building…"
                  >
                    Rebuild drafts
                  </BusyButton>
                </div>
              </div>

              <div className="desktop-sticky">
                {activeDraft ? (
                  <article className="mail-card">
                    <div className="mail-card-top">
                      <div>
                        <p className="font-semibold">{activeDraft.contact.name}</p>
                        <p className="text-xs text-()">{activeDraft.contact.email}</p>
                      </div>
                      <span className="status-pill">{activeDraft.status}</span>
                    </div>
                    <p className="mail-card-subject">{activeDraft.subject}</p>
                    <div
                      className="mail-preview-body"
                      dangerouslySetInnerHTML={{ __html: activeDraft.bodyHtml }}
                    />
                    <div className="mail-actions">
                      <BusyButton
                        type="button"
                        className="btn btn-accent"
                        busy={busy === `copy:${activeDraft.id}`}
                        busyLabel="Copying…"
                        disabled={Boolean(busy) && busy !== `copy:${activeDraft.id}`}
                        onClick={() => onRichCopy(activeDraft)}
                      >
                        Rich copy
                      </BusyButton>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={Boolean(busy)}
                        onClick={async () => {
                          const ok = await copyText(activeDraft.subject);
                          flash(ok ? "Subject copied" : "Copy failed");
                        }}
                      >
                        Subject
                      </button>
                      <BusyButton
                        type="button"
                        className="btn btn-ghost"
                        busy={busy === `gmail:${activeDraft.id}`}
                        busyLabel="Opening…"
                        disabled={Boolean(busy) && busy !== `gmail:${activeDraft.id}`}
                        onClick={() => onGmail(activeDraft)}
                      >
                        Gmail
                      </BusyButton>
                      <BusyButton
                        type="button"
                        className="btn btn-ghost"
                        busy={busy === `draft:sent_manual:${activeDraft.id}`}
                        busyLabel="Saving…"
                        disabled={Boolean(busy) && busy !== `draft:sent_manual:${activeDraft.id}`}
                        onClick={() => markDraft(activeDraft.id, "sent_manual")}
                      >
                        Mark sent
                      </BusyButton>
                    </div>
                  </article>
                ) : null}
              </div>
            </div>
          )}

          {latestDrafts.length === 0 ? (
            <div className="flex gap-2 lg:max-w-md">
              <button type="button" className="btn btn-ghost flex-1" onClick={() => setStep(2)}>
                Back
              </button>
              <BusyButton
                type="button"
                className="btn btn-primary flex-1"
                onClick={generateDrafts}
                busy={busy === "drafts"}
                busyLabel="Building…"
              >
                Rebuild drafts
              </BusyButton>
            </div>
          ) : null}
        </section>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-lg bg-() px-4 py-3 text-center text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
