export const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#64748b",
];

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#f59e0b",
  LOCKED: "#8b5cf6",
  ACTIVE: "#10b981",
  CLOSED: "#64748b",
};

export function formatChartDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatChartDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit" });
}
