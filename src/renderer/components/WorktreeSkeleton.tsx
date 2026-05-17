export function WorktreeSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-80 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-7 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="h-3 animate-pulse rounded bg-muted" />
            <div className="h-3 animate-pulse rounded bg-muted" />
            <div className="h-3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
