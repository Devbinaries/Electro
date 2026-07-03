import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import ChartCard from "~/components/charts/ChartCard";
import ChartContainer from "~/components/charts/ChartContainer";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "~/components/charts/recharts";
import api from "~/services/api";

interface PublicElection {
  election_id: string;
  title: string;
  status: string;
  final_results?: Array<{
    position_id: string;
    position__name: string;
    candidate_id: string;
    candidate__name: string;
    total_votes: number;
  }>;
}

interface ElectionDetail {
  election_id: string;
  title: string;
  status: string;
  description?: string;
  message?: string;
  results: Array<{
    position_id: string | number;
    position__name: string;
    candidate_id: string | number;
    candidate__name: string;
    total_votes: number;
  }>;
}

export default function ObserverResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [elections, setElections] = useState<PublicElection[]>([]);
  const [electionDetail, setElectionDetail] = useState<ElectionDetail | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const requested = searchParams.get("election");
    if (!requested) {
      setElections([]);
      setElectionDetail(null);
      setSelectedId(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setDetailLoading(true);
    api
      .get(`/api/public/elections/${requested}/`)
      .then((response) => {
        const data = response.data;
        const pubElection: PublicElection = {
          election_id: data.election_id,
          title: data.title,
          status: data.status,
        };
        setElections([pubElection]);
        setSelectedId(data.election_id);
        setElectionDetail(data);
      })
      .catch(() => {
        setElections([]);
        setSelectedId(null);
        setElectionDetail(null);
      })
      .finally(() => {
        setLoading(false);
        setDetailLoading(false);
      });
  }, [searchParams]);

  const handleSelectElection = (electionId: string) => {
    setSelectedId(electionId);
    setSearchParams({ election: electionId });
  };

  const groupedResults = useMemo(() => {
    const rows = electionDetail?.results ?? [];
    const map = new Map<string, Array<{ name: string; votes: number }>>();
    for (const row of rows) {
      const entries = map.get(row.position__name) ?? [];
      entries.push({ name: row.candidate__name, votes: row.total_votes });
      map.set(row.position__name, entries);
    }
    return Array.from(map.entries()).map(([position, candidates]) => ({
      position,
      candidates: candidates.sort((a, b) => b.votes - a.votes),
    }));
  }, [electionDetail]);

  const maxVotes = useMemo(() => {
    let max = 0;
    for (const position of groupedResults) {
      for (const candidate of position.candidates) {
        max = Math.max(max, candidate.votes);
      }
    }
    return max || 1;
  }, [groupedResults]);

  const statusLabel =
    electionDetail?.status === "ACTIVE"
      ? "Live"
      : electionDetail?.status === "CLOSED"
        ? "Final Results"
        : (electionDetail?.status ?? "");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Election Results</h1>
            <p className="mt-2 text-slate-500">
              View live and final results for public elections.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Loading results…
          </div>
        ) : elections.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            {searchParams.get("election")
              ? "The requested election was not found or is not available."
              : "Please use the specific election link provided to you to view results."}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="space-y-3">
              {elections.map((election) => (
                <button
                  key={election.election_id}
                  type="button"
                  onClick={() => handleSelectElection(election.election_id)}
                  className={`w-full rounded-3xl border p-5 text-left transition ${
                    election.election_id === selectedId
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <h3 className="font-semibold text-slate-900">{election.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{election.status}</p>
                </button>
              ))}
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                {detailLoading ? (
                  <p className="text-slate-500">Loading election…</p>
                ) : electionDetail ? (
                  <>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-slate-900">{electionDetail.title}</h2>
                      {statusLabel && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            electionDetail.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    {electionDetail.description && (
                      <p className="mt-2 text-sm text-slate-500">{electionDetail.description}</p>
                    )}
                    {electionDetail.message && (
                      <p className="mt-3 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
                        {electionDetail.message}
                      </p>
                    )}
                  </>
                ) : (
                  <h2 className="text-2xl font-semibold text-slate-900">Select an election</h2>
                )}
              </div>

              {detailLoading ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
                  Loading results…
                </div>
              ) : groupedResults.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
                  {electionDetail?.status === "ACTIVE"
                    ? "No votes recorded yet."
                    : "Results are not available for this election."}
                </div>
              ) : (
                <>
                  <div className="grid gap-6 xl:grid-cols-2">
                    {groupedResults.map((position) => (
                      <ChartCard
                        key={`${position.position}-chart`}
                        title={position.position}
                        subtitle="Vote distribution"
                      >
                        <ChartContainer height={280}>
                          <BarChart data={position.candidates} margin={{ left: 8, right: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="name" fontSize={11} interval={0} angle={-20} textAnchor="end" height={70} />
                            <YAxis allowDecimals={false} fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="votes" fill="#2563eb" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ChartContainer>
                      </ChartCard>
                    ))}
                  </div>

                  {groupedResults.map((position) => (
                    <div
                      key={position.position}
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <h3 className="text-lg font-semibold text-slate-900">{position.position}</h3>
                      <div className="mt-4 space-y-4">
                        {position.candidates.map((candidate) => {
                          const percentage = (candidate.votes / maxVotes) * 100;
                          return (
                            <div key={candidate.name}>
                              <div className="mb-2 flex items-center justify-between">
                                <span className="font-medium text-slate-900">{candidate.name}</span>
                                <span className="text-sm font-semibold text-blue-600">
                                  {candidate.votes} {candidate.votes === 1 ? "vote" : "votes"}
                                </span>
                              </div>
                              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                                  style={{ width: `${Math.max(percentage, 5)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
