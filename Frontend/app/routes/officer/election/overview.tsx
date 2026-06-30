import ElectionStatusBadge from "~/components/dashboard/ElectionStatusBadge";
import { useElection } from "~/hooks/useElection";

export default function ElectionOverviewPage() {
  const { election, loading } = useElection();
  const status = election?.status ?? "draft";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
            <p className="mt-2 text-sm text-slate-500">
              Snapshot of the election’s current state and key metrics.
            </p>
          </div>
          <ElectionStatusBadge status={status as any} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Start Date</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election?.startDate ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">End Date</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election?.endDate ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Positions</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading
                ? "Loading…"
                : election
                ? Array.isArray(election.positions)
                  ? election.positions.length
                  : election.positions
                : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Eligible Voters</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election?.eligibleVoters?.toLocaleString() ?? "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Next step</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {status === "draft"
              ? "Finalize configuration to schedule voting"
              : status === "scheduled"
              ? "Wait for the voting window to open"
              : status === "active"
              ? "Monitor ballots while voting is open"
              : "Review election progress."}
          </p>
        </div>
      </div>
    </div>
  );
}
