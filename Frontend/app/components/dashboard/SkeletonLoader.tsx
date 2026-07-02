export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="mt-4 h-8 w-16 rounded bg-slate-200" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-5 w-40 rounded bg-slate-200" />
      <div className="h-48 rounded-xl bg-slate-100" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3 p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded bg-slate-100" />
      ))}
    </div>
  );
}
