interface Props {
  status:
    | "draft"
    | "locked"
    | "open"
    | "closed"
    | "results"
    | "published"
    | "live"
    | "counting"
    | "completed"
    | "archived"
    | "scheduled"
    | "active";
}

export default function ElectionStatusBadge({
  status,
}: Props) {
  const styles = {
    draft:
      "bg-yellow-100 text-yellow-700",
    locked:
      "bg-amber-100 text-amber-700",
    open:
      "bg-green-100 text-green-700",
    closed:
      "bg-indigo-100 text-indigo-700",
    results:
      "bg-sky-100 text-sky-700",
    published:
      "bg-teal-100 text-teal-700",
    live:
      "bg-emerald-100 text-emerald-700",
    scheduled:
      "bg-purple-100 text-purple-700",
    active:
      "bg-blue-100 text-blue-700",
    counting:
      "bg-slate-100 text-slate-700",
    completed:
      "bg-slate-200 text-slate-700",
    archived:
      "bg-slate-300 text-slate-600",
  } as const;

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}