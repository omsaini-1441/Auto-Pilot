"use client";

import { useMemo, useState } from "react";
import { BusyButton } from "@/components/ui/BusyButton";
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
  const [actionBusy, setActionBusy] = useState("");
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
    setActionBusy("new");
    try {
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
    } finally {
      setActionBusy("");
    }
  }

  async function createAi() {
    setActionBusy("ai");
    setMsg("");
    try {
      const res = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ save: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg("AI generate failed");
        return;
      }
      await reload(data.template?.id);
      setMsg(data.notes || "AI template saved");
    } finally {
      setActionBusy("");
    }
  }

  async function save(id: string) {
    const t = draftFor(templates.find((x) => x.id === id)!);
    setActionBusy(`save:${id}`);
    setMsg("");
    try {
      await fetch(`/api/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(t),
      });
      await reload(id);
      setMsg("Saved");
    } finally {
      setActionBusy("");
    }
  }

  async function setDefault(id: string) {
    setMsg("");
    setActionBusy(`default:${id}`);
    try {
      await fetch(`/api/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      await reload(id);
      setMsg("Default updated");
    } finally {
      setActionBusy("");
    }
  }

  async function duplicate(id: string) {
    const t = draftFor(templates.find((x) => x.id === id)!);
    setMsg("");
    setActionBusy(`dup:${id}`);
    try {
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
    } finally {
      setActionBusy("");
    }
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
    setActionBusy(`del:${id}`);
    try {
      await fetch(`/api/templates/${id}`, { method: "DELETE" });
      await reload();
      setExpandedId(null);
      setMsg("Deleted");
    } finally {
      setActionBusy("");
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const anyBusy = Boolean(actionBusy);
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
          <BusyButton
            type="button"
            className="btn btn-ghost text-sm px-3"
            onClick={createAi}
            busy={actionBusy === "ai"}
            busyLabel="AI…"
            disabled={anyBusy && actionBusy !== "ai"}
          >
            AI
          </BusyButton>
          <BusyButton
            type="button"
            className="btn btn-accent text-sm px-3"
            onClick={createNew}
            busy={actionBusy === "new"}
            busyLabel="…"
            disabled={anyBusy && actionBusy !== "new"}
          >
            New
          </BusyButton>
        </div>
      </div>

      {msg ? <p className="text-sm text-[var(--accent)]">{msg}</p> : null}

      {templates.length === 0 ? (
        <div className="panel text-center">
          <p className="font-medium">No templates yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Create one or generate with AI.</p>
          <div className="mt-4 flex gap-2 justify-center">
            <BusyButton
              type="button"
              className="btn btn-ghost"
              onClick={createAi}
              busy={actionBusy === "ai"}
              busyLabel="Writing…"
              disabled={anyBusy && actionBusy !== "ai"}
            >
              AI draft
            </BusyButton>
            <BusyButton
              type="button"
              className="btn btn-primary"
              onClick={createNew}
              busy={actionBusy === "new"}
              busyLabel="Creating…"
              disabled={anyBusy && actionBusy !== "new"}
            >
              New template
            </BusyButton>
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
                      <BusyButton
                        type="button"
                        className="btn btn-primary"
                        busy={actionBusy === `save:${t.id}`}
                        busyLabel="Saving…"
                        disabled={anyBusy && actionBusy !== `save:${t.id}`}
                        onClick={() => save(t.id)}
                      >
                        Save
                      </BusyButton>
                      {!t.isDefault ? (
                        <BusyButton
                          type="button"
                          className="btn btn-ghost"
                          busy={actionBusy === `default:${t.id}`}
                          busyLabel="…"
                          disabled={anyBusy && actionBusy !== `default:${t.id}`}
                          onClick={() => setDefault(t.id)}
                        >
                          Set default
                        </BusyButton>
                      ) : (
                        <span className="self-center text-xs text-[var(--muted)]">Current default</span>
                      )}
                      <BusyButton
                        type="button"
                        className="btn btn-ghost"
                        busy={actionBusy === `dup:${t.id}`}
                        busyLabel="…"
                        disabled={anyBusy && actionBusy !== `dup:${t.id}`}
                        onClick={() => duplicate(t.id)}
                      >
                        Duplicate
                      </BusyButton>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={anyBusy}
                        onClick={() => resetLocal(t.id)}
                      >
                        Reset
                      </button>
                      <BusyButton
                        type="button"
                        className="btn btn-ghost text-[var(--danger)]"
                        busy={actionBusy === `del:${t.id}`}
                        busyLabel="Deleting…"
                        disabled={anyBusy && actionBusy !== `del:${t.id}`}
                        onClick={() => remove(t.id)}
                      >
                        Delete
                      </BusyButton>
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
