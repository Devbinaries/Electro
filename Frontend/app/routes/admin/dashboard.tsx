import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Users,
  Vote,
  Shield,
  UserCheck,
  BarChart3,
  Lock,
  FileText,
  Activity,
  Target,
} from "lucide-react";
import StatsCard from "~/components/dashboard/StatsCard";
import ActivityTimeline from "~/components/dashboard/ActivityTimeline";
import ChartCard from "~/components/charts/ChartCard";
import ChartContainer from "~/components/charts/ChartContainer";
import EmptyState from "~/components/dashboard/EmptyState";
import { SkeletonCard, SkeletonChart } from "~/components/dashboard/SkeletonLoader";
import { formatChartDate, formatChartDateTime } from "~/components/charts/chartTheme";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "~/components/charts/recharts";
import {
  getAdminElectionAnalytics,
  getAdminElections,
  getAdminSummary,
} from "~/services/election";

type AdminSummary = Awaited<ReturnType<typeof getAdminSummary>>;
type ElectionAnalytics = Awaited<ReturnType<typeof getAdminElectionAnalytics>>;

type AdminElection = {
  election_id: string;
  title: string;
  status: string;
  start_date?: string;
  end_date?: string;
  electoral_officer?: { email?: string } | null;
  auditors?: Array<{ email?: string }>;
};

const formatElectionDateTime = (value?: string) => {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

function ChartFallback() {
  return <SkeletonChart />;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [analytics, setAnalytics] = useState<ElectionAnalytics | null>(null);
  const [elections, setElections] = useState<AdminElection[]>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([getAdminSummary(), getAdminElections()])
      .then(([summaryResponse, electionsResponse]) => {
        if (!mounted) return;
        setSummary(summaryResponse);
        const list = Array.isArray(electionsResponse) ? electionsResponse : [];
        setElections(list);
        const active = list.find((e) => e.status === "ACTIVE");
        setSelectedElectionId(active?.election_id ?? list[0]?.election_id ?? null);
      })
      .catch(() => {
        if (mounted) setError("Unable to load admin dashboard data.");
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
    getAdminElectionAnalytics(selectedElectionId)
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

  const topCandidates = useMemo(
    () => (analytics?.votes_per_candidate ?? []).slice(0, 8),
    [analytics]
  );

  const verificationData = useMemo(
    () =>
      (analytics?.verification_breakdown ?? []).map((item) => ({
        ...item,
        fill: item.label === "Success" ? "#10b981" : "#ef4444",
      })),
    [analytics]
  );

  const auditActionData = useMemo(
    () => (analytics?.audit_action_breakdown ?? []).slice(0, 6),
    [analytics]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>
        <p className="mt-2 text-slate-600">System-wide summary with per-election analytics</p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/admin/users" className="font-semibold text-blue-600 hover:text-blue-700">
          Manage users
        </Link>
        <Link to="/admin/elections" className="font-semibold text-blue-600 hover:text-blue-700">
          Manage elections
        </Link>
        <Link to="/admin/snapshots" className="font-semibold text-blue-600 hover:text-blue-700">
          View activity
        </Link>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Platform Summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatsCard title="Total Elections" value={summary?.total_elections ?? 0} icon={BarChart3} accent="blue" loading={loading} />
          <StatsCard title="Active Elections" value={summary?.active_elections ?? 0} icon={Activity} accent="green" loading={loading} />
          <StatsCard title="Draft Elections" value={summary?.draft_elections ?? 0} icon={FileText} accent="orange" loading={loading} />
          <StatsCard title="Locked Elections" value={summary?.locked_elections ?? 0} icon={Lock} accent="purple" loading={loading} />
          <StatsCard title="Closed Elections" value={summary?.closed_elections ?? 0} icon={Shield} accent="slate" loading={loading} />
          <StatsCard title="Electoral Officers" value={summary?.total_electoral_officers ?? 0} icon={UserCheck} accent="blue" loading={loading} />
          <StatsCard title="Active Officers" value={summary?.active_electoral_officers ?? 0} icon={Users} accent="green" loading={loading} />
          <StatsCard title="Auditors" value={summary?.total_auditors ?? 0} icon={Shield} accent="purple" loading={loading} />
          <StatsCard title="Registered Voters" value={(summary?.total_registered_voters ?? 0).toLocaleString()} icon={Users} accent="blue" loading={loading} />
          <StatsCard title="Votes Cast" value={(summary?.total_votes_cast ?? 0).toLocaleString()} icon={Vote} accent="green" loading={loading} />
          <StatsCard title="Overall Turnout" value={`${(summary?.overall_turnout_percentage ?? 0).toFixed(1)}%`} icon={BarChart3} accent="orange" loading={loading} />
          <StatsCard title="Total Users" value={(summary?.total_users ?? 0).toLocaleString()} icon={Users} accent="slate" loading={loading} />
        </div>
      </div>

      {elections.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-medium text-slate-700" htmlFor="admin-election-analytics">
            Select Election for Analytics
          </label>
          <select
            id="admin-election-analytics"
            value={selectedElectionId ?? ""}
            onChange={(e) => setSelectedElectionId(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 focus:border-blue-500 focus:outline-none"
          >
            {elections.map((election) => (
              <option key={election.election_id} value={election.election_id}>
                {election.title} — {election.status}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedElectionId && (
        <>
          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              {analytics?.title ?? "Election"} Analytics
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard title="Registered Voters" value={analytics?.registered_voters ?? 0} icon={Users} accent="purple" loading={analyticsLoading} />
              <StatsCard title="Votes Cast" value={analytics?.votes_cast ?? 0} icon={Vote} accent="orange" loading={analyticsLoading} />
              <StatsCard title="Turnout" value={`${(analytics?.turnout_percentage ?? 0).toFixed(1)}%`} icon={BarChart3} accent="green" loading={analyticsLoading} />
              <StatsCard title="Remaining Voters" value={analytics?.remaining_voters ?? 0} icon={Users} accent="slate" loading={analyticsLoading} />
              <StatsCard title="Positions" value={analytics?.positions ?? 0} icon={Target} accent="blue" loading={analyticsLoading} />
              <StatsCard title="Candidates" value={analytics?.candidates ?? 0} icon={Users} accent="purple" loading={analyticsLoading} />
              <StatsCard title="Audit Events" value={analytics?.audit_events ?? 0} icon={Shield} accent="blue" loading={analyticsLoading} />
              <StatsCard title="Verified Voters" value={analytics?.verification_events ?? 0} icon={UserCheck} accent="green" loading={analyticsLoading} />
              <StatsCard title="Fraud Attempts" value={analytics?.failed_verification_attempts ?? 0} icon={Shield} accent="orange" loading={analyticsLoading} />
              <StatsCard title="OTP Requests" value={analytics?.otp_requests ?? 0} icon={Activity} accent="orange" loading={analyticsLoading} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Live Turnout" subtitle="Voter participation for selected election">
              {analyticsLoading ? (
                <ChartFallback />
              ) : analytics ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <p className="text-4xl font-bold text-slate-900">
                    {analytics.live_turnout.percentage.toFixed(1)}%
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {analytics.live_turnout.voted} of {analytics.live_turnout.total} voters
                  </p>
                  <div className="mt-4 h-3 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${analytics.live_turnout.percentage}%` }}
                    />
                  </div>
                </div>
              ) : (
                <EmptyState />
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

            <ChartCard title="Voting Progress Over Time">
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

            <ChartCard title="Audit Events Over Time">
              {analyticsLoading ? (
                <ChartFallback />
              ) : (analytics?.audit_events_over_time ?? []).length === 0 ? (
                <EmptyState />
              ) : (
                <ChartContainer>
                  <LineChart data={analytics?.audit_events_over_time ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tickFormatter={formatChartDate} fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ChartContainer>
              )}
            </ChartCard>

            <ChartCard title="Verification Success vs Failure">
              {analyticsLoading ? (
                <ChartFallback />
              ) : verificationData.length === 0 ? (
                <EmptyState />
              ) : (
                <ChartContainer>
                  <PieChart>
                    <Pie data={verificationData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90}>
                      {verificationData.map((entry) => (
                        <Cell key={entry.label} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ChartContainer>
              )}
            </ChartCard>

            <ChartCard title="Audit Action Breakdown" className="lg:col-span-2">
              {analyticsLoading ? (
                <ChartFallback />
              ) : auditActionData.length === 0 ? (
                <EmptyState />
              ) : (
                <ChartContainer>
                  <BarChart data={auditActionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="action" fontSize={11} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </ChartCard>
          </div>
        </>
      )}

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent Activity</h2>
          <ActivityTimeline
            items={analytics?.recent_activity ?? []}
            loading={analyticsLoading || loading}
          />
        </div>

        <div className="rounded-2xl bg-white shadow">
          <div className="border-b p-5">
            <h2 className="text-lg font-semibold text-slate-900">Elections & Assignments</h2>
          </div>
          {loading ? (
            <div className="grid gap-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-slate-500">
                    <th className="p-4">Election</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Start</th>
                    <th className="p-4">End</th>
                    <th className="p-4">Officer</th>
                    <th className="p-4">Auditors</th>
                  </tr>
                </thead>
                <tbody>
                  {elections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        No elections found.
                      </td>
                    </tr>
                  ) : (
                    elections.map((election) => (
                      <tr key={election.election_id} className="border-t hover:bg-slate-50">
                        <td className="p-4 font-medium">{election.title}</td>
                        <td className="p-4">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold">
                            {election.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {formatElectionDateTime(election.start_date)}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {formatElectionDateTime(election.end_date)}
                        </td>
                        <td className="p-4 text-sm">{election.electoral_officer?.email ?? "—"}</td>
                        <td className="p-4 text-sm">
                          {(election.auditors ?? []).map((a) => a.email).join(", ") || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
