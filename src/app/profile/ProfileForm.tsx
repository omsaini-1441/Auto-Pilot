"use client";

import { useState } from "react";
import { BusyButton } from "@/components/ui/BusyButton";

type Profile = {
  fullName: string;
  headline: string;
  linkedIn: string;
  portfolio: string;
  phone: string;
  summary: string;
  skills: string;
  autofillJson: string;
};

export function ProfileForm({ initial }: { initial: Profile }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3 lg:grid lg:grid-cols-2 lg:gap-x-5 lg:gap-y-3 lg:space-y-0">
      {(
        [
          ["fullName", "Full name", "text"],
          ["headline", "Headline", "text"],
          ["linkedIn", "LinkedIn URL", "url"],
          ["portfolio", "Portfolio URL", "url"],
          ["phone", "Phone", "tel"],
        ] as const
      ).map(([key, label, type]) => (
        <div key={key} className={key === "phone" ? "lg:col-span-1" : undefined}>
          <label className="label" htmlFor={key}>
            {label}
          </label>
          <input
            id={key}
            className="field"
            type={type}
            value={form[key]}
            onChange={(e) => set(key, e.target.value)}
          />
        </div>
      ))}
      <div className="lg:col-span-2">
        <label className="label" htmlFor="summary">
          Summary
        </label>
        <textarea
          id="summary"
          className="field min-h-[90px]"
          value={form.summary}
          onChange={(e) => set("summary", e.target.value)}
        />
      </div>
      <div className="lg:col-span-2">
        <label className="label" htmlFor="skills">
          Skills
        </label>
        <textarea
          id="skills"
          className="field min-h-[72px]"
          value={form.skills}
          onChange={(e) => set("skills", e.target.value)}
        />
      </div>
      <div className="lg:col-span-2">
        <label className="label" htmlFor="autofillJson">
          Autofill JSON (extension-ready)
        </label>
        <textarea
          id="autofillJson"
          className="field min-h-[72px] font-mono text-xs"
          value={form.autofillJson}
          onChange={(e) => set("autofillJson", e.target.value)}
        />
      </div>
      <div className="lg:col-span-2 lg:flex lg:items-center lg:gap-4">
        <BusyButton className="btn btn-primary w-full lg:w-auto lg:min-w-[10rem]" type="submit" busy={saving} busyLabel="Saving…">
          Save profile
        </BusyButton>
        {saved ? <p className="text-sm text-(--accent)">Saved</p> : null}
      </div>
    </form>
  );
}
