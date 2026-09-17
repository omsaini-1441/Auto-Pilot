import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { JobList } from "./JobList";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { contacts: true, drafts: true } } },
  });

  const serialized = JSON.parse(JSON.stringify(jobs));

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Jobs</h1>
          <p className="text-sm text-[var(--muted)]">Your saved hiring pipeline</p>
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
        <JobList initial={serialized} />
      )}
    </div>
  );
}
