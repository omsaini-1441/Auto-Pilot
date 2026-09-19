"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BusyButton } from "@/components/ui/BusyButton";

export default function NewJobPage() {
  const router = useRouter();
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [extractMeta, setExtractMeta] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [opening, setOpening] = useState(false);

  async function extract() {
    setLoading(true);
    setExtractMeta("");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl, sourceText }),
      });
      const data = await res.json();
      setCompany(data.company || "");
      setRole(data.role || "");
      setLocation(data.location || "");
      setExtractMeta(
        [data.confidence && `confidence: ${data.confidence}`, data.notes]
          .filter(Boolean)
          .join(" — "),
      );
    } finally {
      setLoading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl,
          sourceText,
          company,
          role,
          location,
          notes,
          extractMeta: { notes: extractMeta },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOpening(true);
        router.push(`/jobs/${data.job.id}`);
        return;
      }
      setSaving(false);
    } catch {
      setSaving(false);
    }
  }

  const submitBusy = saving || opening;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-(family-name:--font-display) text-3xl">Add job</h1>
        <p className="text-sm text-(--muted)">Link and/or text dump → AI extract → confirm</p>
      </div>

      <form onSubmit={save} className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
        <div className="card space-y-3">
          <div>
            <label className="label" htmlFor="url">
              Job URL
            </label>
            <input
              id="url"
              className="field"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://…"
              inputMode="url"
            />
          </div>
          <div>
            <label className="label" htmlFor="dump">
              Or paste job text
            </label>
            <textarea
              id="dump"
              className="field min-h-[120px] lg:min-h-[200px]"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste LinkedIn / careers post text here"
            />
          </div>
          <BusyButton
            type="button"
            className="btn btn-ghost w-full"
            onClick={extract}
            busy={loading}
            busyLabel="Extracting…"
            disabled={submitBusy || (!sourceUrl && !sourceText)}
          >
            Extract with AI
          </BusyButton>
          {extractMeta ? <p className="text-xs text-(--muted)">{extractMeta}</p> : null}
        </div>

        <div className="card space-y-3">
          <div>
            <label className="label" htmlFor="company">
              Company
            </label>
            <input id="company" className="field" value={company} onChange={(e) => setCompany(e.target.value)} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="role">
                Role
              </label>
              <input id="role" className="field" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="location">
                Location
              </label>
              <input id="location" className="field" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="notes">
              Notes
            </label>
            <textarea id="notes" className="field min-h-[72px] lg:min-h-[120px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <BusyButton
          className="btn btn-primary w-full lg:col-span-2 lg:max-w-xs"
          type="submit"
          busy={submitBusy}
          busyLabel={opening ? "Opening job…" : "Saving…"}
        >
          Save job
        </BusyButton>
      </form>
    </div>
  );
}
