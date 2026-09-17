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

export function TemplatesClient({ initial }: { initial: Template[] }) {
  const [templates, setTemplates] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id || "");
  const active = templates.find((t) => t.id === activeId) || null;
  const [saving, setSaving] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const preview = useMemo(() => {
    if (!active) return null;
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
      subject: fillPlaceholders(active.subject, ctx),
      bodyHtml: fillPlaceholders(active.bodyHtml, ctx),
    };
  }, [active]);

  async function reload() {
    const res = await fetch("/api/templates");
    const data = await res.json();
    setTemplates(data.templates);
    if (!data.templates.find((t: Template) => t.id === activeId)) {
      setActiveId(data.templates[0]?.id || "");
    }
  }

  async function createNew() {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New template",
        subject: "Quick note — [role] at [company name]",
        bodyHtml:
          "<p>Hi [person name],</p><p>I noticed <strong>[company name]</strong> is hiring for <strong>[role]</strong>.</p><p>Best,<br/>[my name]</p>",
      }),
    });
    const data = await res.json();
    await reload();
    setActiveId(data.template.id);
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
    await reload();
    if (data.template?.id) setActiveId(data.template.id);
    setMsg(data.notes || "AI template saved");
  }

  async function save() {
    if (!active) return;
    setSaving(true);
    await fetch(`/api/templates/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(active),
    });
    setSaving(false);
    await reload();
    setMsg("Saved");
  }

  async function remove() {
    if (!active) return;
    if (!confirm(`Delete template “${active.name}”?`)) return;
    await fetch(`/api/templates/${active.id}`, { method: "DELETE" });
    await reload();
  }

  function patch(partial: Partial<Template>) {
    if (!active) return;
    setTemplates((prev) => prev.map((t) => (t.id === active.id ? { ...t, ...partial } : t)));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Templates</h1>
          <p className="text-sm text-[var(--muted)]">Save many drafts; use [person name] / [company name]</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost text-sm px-3" onClick={createAi} disabled={aiBusy}>
            {aiBusy ? "AI…" : "AI"}
          </button>
          <button type="button" className="btn btn-accent" onClick={createNew}>
            New
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveId(t.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              t.id === activeId ? "bg-[var(--ink)] text-white" : "bg-white border border-[var(--border)]"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {active ? (
        <div className="space-y-3">
          <div>
            <label className="label">Name</label>
            <input className="field" value={active.name} onChange={(e) => patch({ name: e.target.value })} />
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="field" value={active.subject} onChange={(e) => patch({ subject: e.target.value })} />
          </div>
          <div>
            <label className="label">Body</label>
            <RichEditor value={active.bodyHtml} onChange={(html) => patch({ bodyHtml: html })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={active.isDefault}
              onChange={(e) => patch({ isDefault: e.target.checked })}
            />
            Default template
          </label>
          <button type="button" className="btn btn-primary w-full" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save template"}
          </button>
          <button type="button" className="btn btn-ghost w-full text-sm text-[var(--danger)]" onClick={remove}>
            Delete template
          </button>
          {msg ? <p className="text-sm text-[var(--accent)]">{msg}</p> : null}

          {preview ? (
            <div className="card space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Preview (sample fill)
              </p>
              <p className="text-sm font-semibold">{preview.subject}</p>
              <div
                className="prose prose-sm max-w-none rounded-md border border-[var(--border)] bg-white p-3"
                dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
              />
            </div>
          ) : null}

          <details className="card text-sm">
            <summary className="cursor-pointer font-medium">Placeholders</summary>
            <ul className="mt-2 grid grid-cols-2 gap-1 text-xs text-[var(--muted)]">
              {PLACEHOLDER_HELP.map((p) => (
                <li key={p}>
                  <code>{p}</code>
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : (
        <div className="card text-sm text-[var(--muted)]">Create a template to get started.</div>
      )}
    </div>
  );
}
