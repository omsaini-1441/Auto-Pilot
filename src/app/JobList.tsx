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

function formatUpdated(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

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
              filter === id ? "bg-(--ink) text-white" : "border border-(--border) bg-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card text-center text-sm text-(--muted)">No jobs in this filter.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-(--border) bg-white/90">
          <div className="grid grid-cols-[1fr_auto] gap-2 border-b border-(--border) bg-(--surface) px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-(--muted) lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_5.5rem_4.5rem_5.5rem] lg:gap-3 lg:px-4">
            <span>Job</span>
            <span className="hidden lg:block">Role / location</span>
            <span className="hidden text-right lg:block">Contacts</span>
            <span className="hidden text-right lg:block">Drafts</span>
            <span className="text-right lg:text-center">Outreached</span>
          </div>
          <ul className="divide-y divide-(--border)">
            {visible.map((job) => {
              const outreached = job.status === "outreached";
              const busy = busyId === job.id;
              return (
                <li key={job.id}>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_5.5rem_4.5rem_5.5rem] lg:gap-3 lg:px-4">
                    <Link href={`/jobs/${job.id}`} className="min-w-0">
                      <p className="truncate font-semibold text-(--ink)">{job.company || "Unknown company"}</p>
                      <p className="truncate text-sm text-(--muted) lg:hidden">
                        {job.role || "Role TBD"}
                        {job.location ? ` · ${job.location}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-(--muted) lg:hidden">
                        {job._count.contacts} contacts · {job._count.drafts} drafts · {job.status}
                      </p>
                      <p className="mt-1 hidden text-xs text-(--muted) lg:block">
                        {job.status}
                        {job.updatedAt ? ` · ${formatUpdated(job.updatedAt)}` : ""}
                      </p>
                    </Link>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="hidden min-w-0 lg:block"
                    >
                      <p className="truncate text-sm text-(--ink)">{job.role || "Role TBD"}</p>
                      <p className="truncate text-xs text-(--muted)">{job.location || "—"}</p>
                    </Link>
                    <p className="hidden text-right text-sm tabular-nums text-(--muted) lg:block">
                      {job._count.contacts}
                    </p>
                    <p className="hidden text-right text-sm tabular-nums text-(--muted) lg:block">
                      {job._count.drafts}
                    </p>
                    <div className="flex justify-end lg:justify-center">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={outreached}
                        aria-busy={busy || undefined}
                        disabled={busy}
                        onClick={(e) => toggleOutreached(job, e)}
                        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                          outreached ? "bg-(--accent)" : "bg-(--border)"
                        } ${busy ? "switch-busy" : ""}`}
                        title={outreached ? "Mark as not outreached" : "Mark outreached"}
                      >
                        {busy ? (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <Spinner size="sm" className="text-(--ink)" />
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
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
