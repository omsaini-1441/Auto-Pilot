import { JobListSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-10 w-24 rounded-[0.55rem]" />
      </div>
      <JobListSkeleton />
    </div>
  );
}
