import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { contacts: true, drafts: true } } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Jobs</h1>
          <p className="text-sm text-[var(--muted)]">Hiring signals you’re working</p>
        </div>
        <Link href="/jobs/new" className="btn btn-accent">
          Add job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="card text-center">
          <p className="font-medium">No jobs yet</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Paste a posting link or text dump to extract company, role, location.
          </p>
          <Link href="/jobs/new" className="btn btn-primary mt-4 inline-flex">
            Start first job
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link href={`/jobs/${job.id}`} className="card block transition hover:border-[var(--accent)]">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{job.company || "Unknown company"}</p>
                    <p className="text-sm text-[var(--muted)]">
                      {job.role || "Role TBD"}
                      {job.location ? ` · ${job.location}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--accent)]">
                    {job.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {job._count.contacts} contacts · {job._count.drafts} drafts
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
