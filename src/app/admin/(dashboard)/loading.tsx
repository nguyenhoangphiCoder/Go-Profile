export default function AdminDashboardLoading() {
  return (
    <div className="max-w-6xl space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-56 rounded-xl bg-muted/70" />
        <div className="h-3.5 w-96 max-w-full rounded-lg bg-muted/50" />
      </div>

      {/* Filter / action bar skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="h-10 w-72 max-w-full rounded-xl bg-muted/60" />
        <div className="h-10 w-36 rounded-xl bg-muted/60" />
      </div>

      {/* Content cards / table skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 shadow-2xs"
          >
            <div className="h-32 w-full rounded-xl bg-muted/50" />
            <div className="h-4 w-3/4 rounded-md bg-muted/70" />
            <div className="h-3 w-1/2 rounded-md bg-muted/50" />
          </div>
        ))}
      </div>
    </div>
  );
}
