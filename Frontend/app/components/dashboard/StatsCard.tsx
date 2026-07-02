import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  loading?: boolean;
  accent?: "blue" | "green" | "purple" | "orange" | "red" | "slate";
}

const accentStyles = {
  blue: "from-blue-50 to-blue-100 text-blue-600 text-blue-900",
  green: "from-green-50 to-green-100 text-green-600 text-green-900",
  purple: "from-purple-50 to-purple-100 text-purple-600 text-purple-900",
  orange: "from-orange-50 to-orange-100 text-orange-600 text-orange-900",
  red: "from-red-50 to-red-100 text-red-600 text-red-900",
  slate: "from-slate-50 to-slate-100 text-slate-600 text-slate-900",
};

export default function StatsCard({
  title,
  value,
  icon: Icon,
  loading = false,
  accent = "slate",
}: Props) {
  const [bg, labelColor, valueColor] = accentStyles[accent].split(" ");

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="mt-4 h-8 w-16 rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${bg} p-6 shadow transition hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <p className={`text-sm font-medium ${labelColor}`}>{title}</p>
        {Icon && <Icon className={`h-5 w-5 ${labelColor} opacity-70`} />}
      </div>
      <h2 className={`mt-3 text-3xl font-bold ${valueColor}`}>{value}</h2>
    </div>
  );
}
