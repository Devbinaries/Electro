import { Link, Outlet } from "react-router";
import { useEffect, useState } from "react";
import ElectionStatusBadge from "~/components/dashboard/ElectionStatusBadge";
import { getElections } from "~/services/election";
import type { Election } from "~/types/election";

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    getElections()
      .then((list) => {
        if (mounted) setElections(list);
      })
      .catch(() => {
        if (mounted) setElections([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Elections</h1>
          <p className="text-sm text-slate-500">
            Select an election to open its workspace.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">
          Loading elections…
        </div>
      ) : elections.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">
          No elections available. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {elections.map((election) => (
            <Link
              key={election.id}
              to={`/officer/election/${election.id}`}
              className="group h-full rounded-3xl bg-white p-6 shadow transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-slate-900 break-words">
                    {election.name}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {election.startDate} - {election.endDate}
                  </p>
                </div>
                <ElectionStatusBadge status={election.status} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Eligible Voters</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {election.eligibleVoters.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Positions</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {Array.isArray(election.positions) ? election.positions.length : election.positions}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* <Outlet /> */}
    </div>
  );
}
