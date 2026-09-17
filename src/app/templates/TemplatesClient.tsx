"use client";

import { useMemo, useState } from "react";
import { RichEditor } from "@/components/RichEditor";
import { fillPlaceholders, PLACEHOLDER_HELP } from "@/lib/placeholders";

type Template = {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  isDefault: boolean;
};

const STARTER = {
  name: "Cold intro",
  subject: "Quick note — [role] at [company name]",
  bodyHtml: `<p>Hi [person name],</p>
<p>I noticed <strong>[company name]</strong> is hiring for <strong>[role]</strong>.</p>
<p>I'm [my name] — [my headline]. I'd love to briefly connect about the role.</p>
<p>Would you be open to a short chat this week?</p>
<p>Thanks,<br/>[my name]</p>`,
};

function subjectPreview(subject: string) {
  const t = subject.trim();
  if (!t) return "No subject";
  return t.length > 64 ? `${t.slice(0, 64)}…` : t;
}

export function TemplatesClient({ initial }: { initial: Template[] }) {
  const [templates, setTemplates] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Template>>({});
  const [savingId, setSavingId] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPlaceholders, setShowPlaceholders] = useState(false);

  function draftFor(t: Template): Template {
    return drafts[t.id] || t;
  }

  function patch(id: string, partial: Partial<Template>) {
    const base = drafts[id] || templates.find((t) => t.id === id);
    if (!base) return;
    setDrafts((prev) => ({ ...prev, [id]: { ...base, ...partial } }));
  }

  async function reload(preferId?: string) {
    const res = await fetch("/api/templates");
    const data = await res.json();
    setTemplates(data.templates);
    setDrafts({});
    if (preferId && data.templates.some((t: Template) => t.id === preferId)) {
      setExpandedId(preferId);
    } else if (expandedId && !data.templates.some((t: Template) => t.id === expandedId)) {
      setExpandedId(data.templates[0]?.id || null);
    }
  }

  async function createNew() {
    setMsg("");
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New template",
        subject: STARTER.subject,
        bodyHtml: STARTER.bodyHtml,
        isDefault: templates.length === 0,
      }),
    });
    const data = await res.json();
    await reload(data.template.id);
    setMsg("Template created");
  }

  async function createAi() {
    setAiBusy(true);
    setMsg("");
    const res = await fetch("/api/templates/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ save: true }),
    });
    const data = await res.json();
    setAiBusy(false);
    if (!res.ok) {
      setMsg("AI generate failed");
      return;
    }
    await reload(data.template?.id);
    setMsg(data.notes || "AI template saved");
  }

  async function save(id: string) {
    const t = draftFor(templates.find((x) => x.id === id)!);
    setSavingId(id);
    setMsg("");
    await fetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });
    setSavingId("");
    await reload(id);
    setMsg("Saved");
  }

  async function setDefault(id: string) {
    setMsg("");
    await fetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    await reload(id);
    setMsg("Default updated");
  }

  async function duplicate(id: string) {
    const t = draftFor(templates.find((x) => x.id === id)!);
    setMsg("");
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${t.name} copy`,
        subject: t.subject,
        bodyHtml: t.bodyHtml,
        isDefault: false,
      }),
    });
    const data = await res.json();
    await reload(data.template.id);
    setMsg("Duplicated");
  }

  function resetLocal(id: string) {
    if (!confirm("Reset this template to the starter cold-intro content? Unsaved edits will be lost.")) return;
    patch(id, {
      name: STARTER.name,
      subject: STARTER.subject,
      bodyHtml: STARTER.bodyHtml,
    });
    setMsg("Reset locally — tap Save to keep it");
  }

  async function remove(id: string) {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    if (!confirm(`Delete “${t.name}”? This cannot be undone.`)) return;
    setMsg("");
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    await reload();
    setExpandedId(null);
    setMsg("Deleted");
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const expanded = templates.find((t) => t.id === expandedId) || null;
  const expandedDraft = expanded ? draftFor(expanded) : null;

  const preview = useMemo(() => {
    if (!expandedDraft) return null;
    const ctx = {
      first_name: "Jane",
      full_name: "Jane Doe",
      email: "jane@acme.com",
      title: "Recruiter",
      company: "Acme Corp",
      role: "SDE 1",
      location: "Bangalore",
      my_name: "You",
      my_headline: "Software engineer",
      my_linkedin: "",
      my_portfolio: "",
      my_phone: "",
      my_summary: "",
      my_skills: "",
    };
    return {
      subject: fillPlaceholders(expandedDraft.subject, ctx),
      bodyHtml: fillPlaceholders(expandedDraft.bodyHtml, ctx),
    };
  }, [expandedDraft]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Templates</h1>
          <p className="text-sm text-[var(--muted)]">
            {templates.length} saved · tap a row to expand
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost text-sm px-3" onClick={createAi} disabled={aiBusy}>
            {aiBusy ? "AI…" : "AI"}
          </button>
          <button type="button" className="btn btn-accent text-sm px-3" onClick={createNew}>
            New
          </button>
        </div>
      </div>

      {msg ? <p className="text-sm text-[var(--accent)]">{msg}</p> : null}

      {templates.length === 0 ? (
        <div className="panel text-center">
          <p className="font-medium">No templates yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Create one or generate with AI.</p>
          <div className="mt-4 flex gap-2 justify-center">
            <button type="button" className="btn btn-ghost" onClick={createAi} disabled={aiBusy}>
              AI draft
            </button>
            <button type="button" className="btn btn-primary" onClick={createNew}>
              New template
            </button>
          </div>
        </div>
      ) : (
        <ul className="tpl-list">
          {templates.map((t) => {
            const open = expandedId === t.id;
            const d = draftFor(t);
            const dirty = Boolean(drafts[t.id]);
            return (
              <li key={t.id} className={`tpl-item ${open ? "is-open" : ""}`}>
                <button type="button" className="tpl-row" onClick={() => toggleExpand(t.id)} aria-expanded={open}>
                  <span className="tpl-chevron" aria-hidden>
                    {open ? "▾" : "▸"}
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold">{d.name || "Untitled"}</span>
                      {t.isDefault ? <span className="tpl-badge">Default</span> : null}
                      {dirty ? <span className="tpl-badge tpl-badge-warn">Unsaved</span> : null}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                      {subjectPreview(d.subject)}
                    </span>
                  </span>
                </button>

                {open && expandedDraft ? (
                  <div className="tpl-body space-y-3">
                    <div>
                      <label className="label">Name</label>
                      <input
                        className="field"
                        value={expandedDraft.name}
                        onChange={(e) => patch(t.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Subject</label>
                      <input
                        className="field"
                        value={expandedDraft.subject}
                        onChange={(e) => patch(t.id, { subject: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Body</label>
                      <RichEditor
                        value={expandedDraft.bodyHtml}
                        onChange={(html) => patch(t.id, { bodyHtml: html })}
                      />
                    </div>

                    <div className="tpl-actions">
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={savingId === t.id}
                        onClick={() => save(t.id)}
                      >
                        {savingId === t.id ? "Saving…" : "Save"}
                      </button>
                      {!t.isDefault ? (
                        <button type="button" className="btn btn-ghost" onClick={() => setDefault(t.id)}>
                          Set default
                        </button>
                      ) : (
                        <span className="self-center text-xs text-[var(--muted)]">Current default</span>
                      )}
                      <button type="button" className="btn btn-ghost" onClick={() => duplicate(t.id)}>
                        Duplicate
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => resetLocal(t.id)}>
                        Reset
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost text-[var(--danger)]"
                        onClick={() => remove(t.id)}
                      >
                        Delete
                      </button>
                    </div>

                    {preview ? (
                      <div className="mail-preview">
                        <p className="mail-preview-meta">Sample preview</p>
                        <h3>{preview.subject}</h3>
                        <div
                          className="mail-preview-body"
                          dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        className="btn btn-ghost w-full text-sm"
        onClick={() => setShowPlaceholders((v) => !v)}
      >
        {showPlaceholders ? "Hide placeholders" : "Show placeholders"}
      </button>
      {showPlaceholders ? (
        <div className="panel">
          <p className="mb-2 text-sm font-medium">Use these in subject or body</p>
          <ul className="grid grid-cols-2 gap-1 text-xs text-[var(--muted)]">
            {PLACEHOLDER_HELP.map((p) => (
              <li key={p}>
                <code>{p}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
