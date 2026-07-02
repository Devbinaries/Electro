import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

import { getOfficerElectionResults } from "~/services/election";
import { useElection } from "~/hooks/useElection";

type ResultRow = {
  position_id: string | number;
  position__name: string;
  candidate_id: string | number;
  candidate__name: string;
  total_votes: number;
};

export default function ElectionResultsPage() {
  const { electionId } = useParams();
  const { election, loading } = useElection();
  const [results, setResults] = useState<ResultRow[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!electionId) return;

    let mounted = true;
    setResultsLoading(true);
    setError("");

    getOfficerElectionResults(electionId)
      .then((response) => {
        if (mounted) setResults(response.results ?? []);
      })
      .catch(() => {
        if (mounted) {
          setResults([]);
          setError("Unable to load election results.");
        }
      })
      .finally(() => {
        if (mounted) setResultsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [electionId, election?.status]);

  const groupedResults = useMemo(() => {
    const map = new Map<string, Array<{ name: string; votes: number }>>();

    for (const row of results) {
      const entries = map.get(row.position__name) ?? [];
      entries.push({ name: row.candidate__name, votes: row.total_votes });
      map.set(row.position__name, entries);
    }

    return Array.from(map.entries()).map(([position, candidates]) => ({
      position,
      candidates,
    }));
  }, [results]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Results</h2>
            <p className="mt-2 text-sm text-slate-500">
              Live vote totals for this election.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading election…"
                : election
                ? `Election: ${election.name}`
                : "Election details unavailable."}
            </p>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-6">
          {resultsLoading ? (
            <p className="text-sm text-slate-500">Loading results…</p>
          ) : groupedResults.length === 0 ? (
            <p className="text-sm text-slate-500">No votes recorded yet.</p>
          ) : (
            groupedResults.map((position) => (
              <div key={position.position} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-900">{position.position}</h3>
                <div className="mt-4 space-y-3">
                  {position.candidates.map((candidate) => (
                    <div key={candidate.name} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{candidate.name}</p>
                        <p className="text-sm text-slate-500">{candidate.votes} votes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
