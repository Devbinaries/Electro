import { Link } from "react-router";
import { useEffect, useState } from "react";
import ElectionStatusBadge from "~/components/dashboard/ElectionStatusBadge";
import { getOfficerElections } from "~/services/election";

type AssignedElection = {
  election_id: string;
  title: string;
  status: string;
  voter_count: number;
  candidate_count: number;
};

export default function ElectionsPage() {
  const [elections, setElections] = useState<AssignedElection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getOfficerElections()
      .then((summary) => {
        if (mounted) setElections(summary.assigned_elections ?? []);
      })
      .catch(() => {
        if (mounted) {
          setElections([]);
          setError("Unable to load assigned elections.");
        }
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
            Select an assigned election to open its workspace.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">
          Loading elections…
        </div>
      ) : elections.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">
          No assigned elections available.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {elections.map((election) => (
            <Link
              key={election.election_id}
              to={`/officer/election/${election.election_id}`}
              className="group h-full rounded-3xl bg-white p-6 shadow transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-slate-900 break-words">
                    {election.title}
                  </h2>
                </div>
                <ElectionStatusBadge status={election.status.toLowerCase() as any} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Eligible Voters</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {election.voter_count.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Candidates</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {election.candidate_count}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
