interface Props {
  title: string;
  value: string | number;
}

export default function StatsCard({
  title,
  value,
}: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <h2 className="mt-3 text-3xl font-bold text-slate-900">
        {value}
      </h2>
    </div>
  );
}