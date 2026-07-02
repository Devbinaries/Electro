import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";

import {
  getOfficerElectionResults,
  getOfficerElections,
} from "~/services/election";

type ResultRow = {
  position_id: string | number;
  position__name: string;
  candidate_id: string | number;
  candidate__name: string;
  total_votes: number;
};

export default function OfficerLiveResultsPage() {
  const [elections, setElections] = useState<
    Array<{ election_id: string; title: string; status: string }>
  >([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getOfficerElections()
      .then((summary) => {
        if (!mounted) return;
        const assigned = summary.assigned_elections ?? [];
        setElections(assigned);
        const preferred =
          assigned.find((election) => election.status === "ACTIVE") ??
          assigned[0] ??
          null;
        setSelectedElectionId(preferred?.election_id ?? null);
      })
      .catch(() => {
        if (mounted) {
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

  useEffect(() => {
    if (!selectedElectionId) {
      setResults([]);
      return;
    }

    let mounted = true;
    setError("");

    getOfficerElectionResults(selectedElectionId)
      .then((response) => {
        if (mounted) setResults(response.results ?? []);
      })
      .catch(() => {
        if (mounted) {
          setResults([]);
          setError("Unable to load live results.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [selectedElectionId]);

  const groupedResults = useMemo(() => {
    const map = new Map<string, Array<{ name: string; votes: number }>>();

    for (const row of results) {
      const entries = map.get(row.position__name) ?? [];
      entries.push({ name: row.candidate__name, votes: row.total_votes });
      map.set(row.position__name, entries);
    }

    const totalVotes = results.reduce((sum, row) => sum + row.total_votes, 0);

    return Array.from(map.entries()).map(([position, candidates]) => ({
      position,
      candidates: candidates.map((candidate) => ({
        ...candidate,
        share: totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0,
      })),
    }));
  }, [results]);

  const selectedElection = elections.find(
    (election) => election.election_id === selectedElectionId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Results</h1>
          <p className="mt-2 text-sm text-slate-500">
            Vote totals for your assigned elections.
          </p>
        </div>
        {selectedElection && (
          <Link
            to={`/officer/election/${selectedElection.election_id}/results`}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Open election results workspace
          </Link>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {elections.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow">
          <label className="text-sm font-medium text-slate-700" htmlFor="results-election">
            Election
          </label>
          <select
            id="results-election"
            value={selectedElectionId ?? ""}
            onChange={(event) => setSelectedElectionId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 p-3"
          >
            {elections.map((election) => (
              <option key={election.election_id} value={election.election_id}>
                {election.title} ({election.status})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">Loading results…</div>
      ) : elections.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">
          No assigned elections available.
        </div>
      ) : groupedResults.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">
          No votes recorded yet for {selectedElection?.title ?? "this election"}.
        </div>
      ) : (
        groupedResults.map((position) => (
          <div key={position.position} className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">{position.position}</h2>
            <div className="space-y-4">
              {position.candidates.map((candidate) => (
                <div key={candidate.name}>
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-slate-900">{candidate.name}</p>
                    <p className="text-sm text-slate-500">
                      {candidate.votes} votes · {candidate.share.toFixed(1)}%
                    </p>
                  </div>
                  <div className="mt-2 h-4 rounded-full bg-slate-200">
                    <div
                      className="h-4 rounded-full bg-blue-600"
                      style={{ width: `${candidate.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
