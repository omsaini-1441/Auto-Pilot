type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden />;
}

export function JobListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading jobs">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-14 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white/90">
        <div className="border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2">
          <Skeleton className="h-3 w-24" />
        </div>
        <ul className="divide-y divide-[var(--border)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="grid grid-cols-[1fr_auto] items-center gap-2 px-3 py-3">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-4 w-2/3 max-w-[12rem]" />
                <Skeleton className="h-3 w-3/4 max-w-[16rem]" />
                <Skeleton className="h-3 w-1/2 max-w-[10rem]" />
              </div>
              <Skeleton className="h-7 w-12 rounded-full" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function JobWorkspaceSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading job">
      <Skeleton className="h-4 w-16" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-9 w-3/4 max-w-[14rem]" />
          <Skeleton className="h-4 w-1/2 max-w-[12rem]" />
        </div>
        <Skeleton className="mt-1 h-7 w-12 rounded-full" />
      </div>
      <Skeleton className="h-11 w-full rounded-full" />
      <div className="panel space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-full max-w-[20rem]" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-11 w-full rounded-[0.55rem]" />
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function TemplatesSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading templates">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-14 rounded-[0.55rem]" />
          <Skeleton className="h-10 w-16 rounded-[0.55rem]" />
        </div>
      </div>
      <div className="tpl-list">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="tpl-item px-3 py-3">
            <div className="flex items-start gap-3">
              <Skeleton className="mt-1 h-3 w-3" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2 max-w-[10rem]" />
                <Skeleton className="h-3 w-3/4 max-w-[16rem]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApolloSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading Apollo">
      <div className="space-y-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-full max-w-[22rem]" />
        <Skeleton className="h-4 w-3/4 max-w-[18rem]" />
      </div>
      <div className="card space-y-3">
        <Skeleton className="h-4 w-2/3 max-w-[14rem]" />
        <Skeleton className="h-11 w-full rounded-[0.55rem]" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="card flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-40" />
            </div>
            <Skeleton className="h-8 w-12 rounded-[0.55rem]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading profile">
      <div className="space-y-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="card space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-[0.55rem]" />
      </div>
    </div>
  );
}

export function PageHeaderSkeleton({ titleWidth = "w-36" }: { titleWidth?: string }) {
  return (
    <div className="space-y-2">
      <Skeleton className={`h-9 ${titleWidth}`} />
      <Skeleton className="h-4 w-56 max-w-full" />
    </div>
  );
}

export function FormCardSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="card space-y-4" aria-busy="true">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-[0.55rem]" />
    </div>
  );
}
