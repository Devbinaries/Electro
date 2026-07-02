interface ActivityItem {
  id: number;
  type: string;
  election_title: string;
  voter?: string | null;
  timestamp: string;
}

interface Props {
  items: ActivityItem[];
  loading?: boolean;
}

const actionLabels: Record<string, string> = {
  ELECTION_LOCKED: "Election locked",
  ELECTION_ACTIVATED: "Election activated",
  ELECTION_CLOSED: "Election closed",
  VOTE_CAST: "Vote cast",
  SESSION_CREATED: "Session created",
  FRAUD_ATTEMPT: "Fraud attempt",
};

const actionColors: Record<string, string> = {
  ELECTION_LOCKED: "bg-purple-100 text-purple-700",
  ELECTION_ACTIVATED: "bg-green-100 text-green-700",
  ELECTION_CLOSED: "bg-slate-100 text-slate-700",
  VOTE_CAST: "bg-blue-100 text-blue-700",
  SESSION_CREATED: "bg-cyan-100 text-cyan-700",
  FRAUD_ATTEMPT: "bg-red-100 text-red-700",
};

export default function ActivityTimeline({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-slate-100" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">No recent activity.</p>;
  }

  return (
    <div className="relative space-y-0">
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200" />
      {items.map((item) => (
        <div key={item.id} className="relative flex gap-4 pb-6 pl-8">
          <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-white bg-blue-500 shadow" />
          <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                  actionColors[item.type] ?? "bg-slate-100 text-slate-700"
                }`}
              >
                {actionLabels[item.type] ?? item.type}
              </span>
              <span className="text-sm font-medium text-slate-900">{item.election_title}</span>
            </div>
            {item.voter && (
              <p className="mt-1 text-xs text-slate-500">Voter: {item.voter}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              {new Date(item.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
