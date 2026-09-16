"use client";

import { useState } from "react";
import { RichEditor } from "@/components/RichEditor";
import { PLACEHOLDER_HELP } from "@/lib/placeholders";

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
        subject: "Hello {{first_name}} — {{role}} at {{company}}",
        bodyHtml: "<p>Hi {{first_name}},</p><p></p><p>Best,<br/>{{my_name}}</p>",
      }),
    });
    const data = await res.json();
    await reload();
    setActiveId(data.template.id);
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
  }

  function patch( partial: Partial<Template>) {
    if (!active) return;
    setTemplates((prev) => prev.map((t) => (t.id === active.id ? { ...t, ...partial } : t)));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Templates</h1>
          <p className="text-sm text-[var(--muted)]">Rich HTML with placeholders</p>
        </div>
        <button type="button" className="btn btn-accent" onClick={createNew}>
          New
        </button>
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
