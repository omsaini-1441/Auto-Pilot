"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

type JobRow = {
  id: string;
  company: string;
  role: string;
  location: string;
  status: string;
  updatedAt: string;
  _count: { contacts: number; drafts: number };
};

export function JobList({ initial }: { initial: JobRow[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initial);
  const [filter, setFilter] = useState<"all" | "active" | "outreached">("all");
  const [busyId, setBusyId] = useState("");

  const visible = useMemo(() => {
    if (filter === "outreached") return jobs.filter((j) => j.status === "outreached");
    if (filter === "active") return jobs.filter((j) => j.status !== "outreached" && j.status !== "archived");
    return jobs;
  }, [jobs, filter]);

  async function toggleOutreached(job: JobRow, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busyId) return;
    const next = job.status === "outreached" ? "researching" : "outreached";
    setBusyId(job.id);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) return;
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: next } : j)));
      router.refresh();
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {(
          [
            ["all", "All"],
            ["active", "Active"],
            ["outreached", "Outreached"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              filter === id ? "bg-[var(--ink)] text-white" : "border border-[var(--border)] bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card text-center text-sm text-[var(--muted)]">No jobs in this filter.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white/90">
          <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            <span>Job</span>
            <span>Outreached</span>
          </div>
          <ul className="divide-y divide-[var(--border)]">
            {visible.map((job) => {
              const outreached = job.status === "outreached";
              const busy = busyId === job.id;
              return (
                <li key={job.id}>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-3">
                    <Link href={`/jobs/${job.id}`} className="min-w-0">
                      <p className="truncate font-semibold text-[var(--ink)]">{job.company || "Unknown company"}</p>
                      <p className="truncate text-sm text-[var(--muted)]">
                        {job.role || "Role TBD"}
                        {job.location ? ` · ${job.location}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {job._count.contacts} contacts · {job._count.drafts} drafts · {job.status}
                      </p>
                    </Link>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={outreached}
                      aria-busy={busy || undefined}
                      disabled={busy}
                      onClick={(e) => toggleOutreached(job, e)}
                      className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                        outreached ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                      } ${busy ? "switch-busy" : ""}`}
                      title={outreached ? "Mark as not outreached" : "Mark outreached"}
                    >
                      {busy ? (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Spinner size="sm" className="text-[var(--ink)]" />
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
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
