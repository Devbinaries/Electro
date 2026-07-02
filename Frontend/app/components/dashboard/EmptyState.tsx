interface Props {
  message?: string;
  title?: string;
}

export default function EmptyState({
  title = "No data available",
  message = "Data will appear here once available.",
}: Props) {
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl bg-slate-50 p-8 text-center">
      <div className="mb-3 text-4xl opacity-40">📊</div>
      <p className="font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{message}</p>
    </div>
  );
}
