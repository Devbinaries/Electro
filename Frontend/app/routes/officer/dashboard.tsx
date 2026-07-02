import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Vote, BarChart3, Target } from "lucide-react";
import ElectionStatusBadge from "~/components/dashboard/ElectionStatusBadge";
import StatsCard from "~/components/dashboard/StatsCard";
import ChartCard from "~/components/charts/ChartCard";
import ChartContainer from "~/components/charts/ChartContainer";
import EmptyState from "~/components/dashboard/EmptyState";
import { SkeletonChart } from "~/components/dashboard/SkeletonLoader";
import { formatChartDateTime } from "~/components/charts/chartTheme";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "~/components/charts/recharts";
import { getOfficerElectionAnalytics, getOfficerElections } from "~/services/election";

type OfficerSummary = Awaited<ReturnType<typeof getOfficerElections>>;
type ElectionAnalytics = Awaited<ReturnType<typeof getOfficerElectionAnalytics>>;

function ChartFallback() {
  return <SkeletonChart />;
}

export default function OfficerDashboard() {
  const [summary, setSummary] = useState<OfficerSummary | null>(null);
  const [analytics, setAnalytics] = useState<ElectionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getOfficerElections()
      .then((response) => {
        if (!mounted) return;
        setSummary(response);
        const active = response.assigned_elections.find((e) => e.status === "ACTIVE");
        setSelectedElectionId(active?.election_id ?? response.assigned_elections[0]?.election_id ?? null);
      })
      .catch(() => {
        if (mounted) setError("Unable to load assigned elections.");
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
      setAnalytics(null);
      return;
    }
    let mounted = true;
    setAnalyticsLoading(true);
    getOfficerElectionAnalytics(selectedElectionId)
      .then((data) => {
        if (mounted) setAnalytics(data);
      })
      .catch(() => {
        if (mounted) setAnalytics(null);
      })
      .finally(() => {
        if (mounted) setAnalyticsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedElectionId]);

  const stats = useMemo(() => {
    if (!summary) return { totalElections: 0, activeElections: 0 };
    return {
      totalElections: summary.assigned_elections.length,
      activeElections: summary.assigned_elections.filter((e) => e.status === "ACTIVE").length,
    };
  }, [summary]);

  const topCandidates = useMemo(
    () => (analytics?.votes_per_candidate ?? []).slice(0, 8),
    [analytics]
  );

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Officer Dashboard</h1>
        <p className="mt-2 text-slate-600">Election analytics and live voting progress</p>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <StatsCard title="Assigned Elections" value={stats.totalElections} icon={BarChart3} accent="blue" loading={loading} />
        <StatsCard title="Active Elections" value={stats.activeElections} icon={Target} accent="green" loading={loading} />
      </div>

      {summary && summary.assigned_elections.length > 0 && (
        <div className="mb-8 rounded-2xl bg-white shadow">
          <div className="border-b p-6">
            <label className="text-sm font-medium text-slate-700" htmlFor="analytics-election">
              Select Election for Analytics
            </label>
            <select
              id="analytics-election"
              value={selectedElectionId ?? ""}
              onChange={(e) => setSelectedElectionId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none"
            >
              {summary.assigned_elections.map((election) => (
                <option key={election.election_id} value={election.election_id}>
                  {election.title} — {election.status}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard title="Registered Voters" value={analytics?.registered_voters ?? 0} icon={Users} accent="purple" loading={analyticsLoading} />
        <StatsCard title="Votes Cast" value={analytics?.votes_cast ?? 0} icon={Vote} accent="orange" loading={analyticsLoading} />
        <StatsCard title="Turnout" value={`${(analytics?.turnout_percentage ?? 0).toFixed(1)}%`} icon={BarChart3} accent="green" loading={analyticsLoading} />
        <StatsCard title="Remaining Voters" value={analytics?.remaining_voters ?? 0} icon={Users} accent="slate" loading={analyticsLoading} />
        <StatsCard title="Positions" value={analytics?.positions ?? 0} icon={Target} accent="blue" loading={analyticsLoading} />
        <StatsCard title="Candidates" value={analytics?.candidates ?? 0} icon={Users} accent="purple" loading={analyticsLoading} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Live Turnout" subtitle="Voter participation progress">
          {analyticsLoading ? (
            <ChartFallback />
          ) : analytics ? (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative mb-4">
                <div className="h-32 w-32 rounded-full border-[10px] border-slate-200" />
                <div
                  className="absolute inset-0 rounded-full border-[10px] border-blue-500 transition-all"
                  style={{
                    clipPath: `inset(0 0 ${100 - analytics.live_turnout.percentage}% 0)`,
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{analytics.live_turnout.percentage.toFixed(1)}%</span>
                  <span className="text-xs text-slate-500">Turnout</span>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                {analytics.live_turnout.voted} of {analytics.live_turnout.total} voters
              </p>
              <div className="mt-4 h-3 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                  style={{ width: `${analytics.live_turnout.percentage}%` }}
                />
              </div>
            </div>
          ) : (
            <EmptyState title="Select an election" />
          )}
        </ChartCard>

        <ChartCard title="Votes by Position">
          {analyticsLoading ? (
            <ChartFallback />
          ) : (analytics?.votes_by_position ?? []).length === 0 ? (
            <EmptyState title="No votes yet" />
          ) : (
            <ChartContainer>
              <BarChart data={analytics?.votes_by_position ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="position" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="votes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </ChartCard>

        <ChartCard title="Votes per Candidate" subtitle="Top candidates">
          {analyticsLoading ? (
            <ChartFallback />
          ) : topCandidates.length === 0 ? (
            <EmptyState title="No votes yet" />
          ) : (
            <ChartContainer>
              <BarChart data={topCandidates} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="candidate_name" width={90} fontSize={11} />
                <Tooltip />
                <Bar dataKey="votes" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </ChartCard>

        <ChartCard title="Voting Progress Over Time" className="lg:col-span-2">
          {analyticsLoading ? (
            <ChartFallback />
          ) : (analytics?.voting_progress_over_time ?? []).length === 0 ? (
            <EmptyState title="No voting activity yet" />
          ) : (
            <ChartContainer>
              <LineChart data={analytics?.voting_progress_over_time ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="timestamp" tickFormatter={formatChartDateTime} fontSize={11} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="votes" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          )}
        </ChartCard>
      </div>

      <div className="rounded-2xl bg-white shadow">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold text-slate-900">Assigned Elections</h2>
        </div>
        {loading ? (
          <div className="p-6 text-slate-500">Loading elections…</div>
        ) : !summary || summary.assigned_elections.length === 0 ? (
          <div className="p-6 text-slate-500">No assigned elections found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-semibold text-slate-600">
                  <th className="p-4">Election</th>
                  <th className="p-4">Voters</th>
                  <th className="p-4">Candidates</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {summary.assigned_elections.map((election) => (
                  <tr key={election.election_id} className="border-t hover:bg-slate-50">
                    <td className="p-4 font-semibold">{election.title}</td>
                    <td className="p-4">{election.voter_count.toLocaleString()}</td>
                    <td className="p-4">{election.candidate_count}</td>
                    <td className="p-4">
                      <ElectionStatusBadge status={election.status.toLowerCase() as "active"} />
                    </td>
                    <td className="p-4">
                      <Link
                        to={`/officer/election/${election.election_id}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
