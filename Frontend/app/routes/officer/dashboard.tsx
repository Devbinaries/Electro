import { useEffect, useState } from "react";
import ElectionStatusBadge from "~/components/dashboard/ElectionStatusBadge";
import { getElections } from "~/services/election";
import type { Election } from "~/types/election";

export default function RecentElectionsTable() {
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
    <>
      <h1 className="text-3xl font-bold mb-4">Officer Dashboard</h1>
      <div className="rounded-2xl bg-white shadow">
        <div className="border-b p-5">
          <h2 className="font-semibold">Recent Elections</h2>
        </div>

        {loading ? (
          <div className="p-6 text-slate-500">Loading elections…</div>
        ) : elections.length === 0 ? (
          <div className="p-6 text-slate-500">No elections found.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-slate-500">
                <th className="p-4">Election</th>
                <th className="p-4">Eligible Voters</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>

            <tbody>
              {elections.map((election) => (
                <tr key={election.id} className="border-t">
                  <td className="p-4">{election.name}</td>
                  <td className="p-4">
                    {election.eligibleVoters.toLocaleString()}
                  </td>
                  <td className="p-4">
                    <ElectionStatusBadge status={election.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}