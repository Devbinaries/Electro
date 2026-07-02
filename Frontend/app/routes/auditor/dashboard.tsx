import { Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { Shield, AlertTriangle, Vote, Users, Key } from "lucide-react";
import StatsCard from "~/components/dashboard/StatsCard";
import ChartCard from "~/components/charts/ChartCard";
import ChartContainer from "~/components/charts/ChartContainer";
import EmptyState from "~/components/dashboard/EmptyState";
import { SkeletonChart } from "~/components/dashboard/SkeletonLoader";
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
  getAuditorAnalytics,
  getAuditorAuditLogs,
  getAuditorFraudLogs,
  getAuditorSummary,
} from "~/services/election";

function ChartFallback() {
  return <SkeletonChart />;
}

export default function AuditorDashboard() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getAuditorSummary>> | null>(null);
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof getAuditorAnalytics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<Array<{ id: number; action: string; timestamp: string }>>([]);
  const [fraudLogs, setFraudLogs] = useState<Array<{ id: number; action: string; metadata_explanation?: string | null; timestamp: string }>>([]);

  useEffect(() => {
    let mounted = true;
    getAuditorSummary()
      .then((response) => {
        if (!mounted) return;
        setSummary(response);
        const active = response.assigned_elections.find((e) => e.status === "ACTIVE");
        setSelectedElectionId(active?.election_id ?? response.assigned_elections[0]?.election_id ?? null);
      })
      .catch(() => {
        if (mounted) setError("Unable to load auditor dashboard.");
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
      setRecentLogs([]);
      setFraudLogs([]);
      return;
    }
    let mounted = true;
    setAnalyticsLoading(true);
    Promise.all([
      getAuditorAnalytics(selectedElectionId),
      getAuditorAuditLogs(selectedElectionId, { page: 1, page_size: 10 }),
      getAuditorFraudLogs(selectedElectionId, { page: 1, page_size: 5 }),
    ])
      .then(([analyticsData, logs, fraud]) => {
        if (!mounted) return;
        setAnalytics(analyticsData);
        setRecentLogs(logs.results);
        setFraudLogs(fraud.results);
      })
      .catch(() => {
        if (mounted) {
          setAnalytics(null);
          setRecentLogs([]);
          setFraudLogs([]);
        }
      })
      .finally(() => {
        if (mounted) setAnalyticsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [selectedElectionId]);

  const turnoutByElection = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of summary?.voter_turnout ?? []) {
      map.set(item.election_id, item.turnout_percentage);
    }
    return map;
  }, [summary]);

  const verificationData = useMemo(
    () =>
      (analytics?.verification_breakdown ?? []).map((item, i) => ({
        ...item,
        fill: item.label === "Success" ? "#10b981" : "#ef4444",
      })),
    [analytics]
  );

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Auditor Dashboard</h1>
        <p className="mt-2 text-slate-600">Election integrity monitoring and audit analytics</p>
      </div>

      {error && <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <StatsCard title="Assigned Elections" value={summary?.assigned_elections.length ?? 0} icon={Shield} accent="blue" loading={loading} />
        <StatsCard title="Fraud Attempts" value={summary?.fraud_attempts ?? 0} icon={Users} accent="slate" loading={loading} />
      </div>

      {summary && summary.assigned_elections.length > 0 && (
        <div className="mb-8 rounded-2xl bg-white shadow">
          <div className="border-b p-6">
            <label className="text-sm font-medium text-slate-700" htmlFor="audit-election">
              Select Election for Analytics
            </label>
            <select
              id="audit-election"
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
        <StatsCard title="Audit Events" value={analytics?.audit_events ?? 0} icon={Shield} accent="green" loading={analyticsLoading} />
        <StatsCard title="Verification Events" value={analytics?.verification_events ?? 0} icon={Key} accent="purple" loading={analyticsLoading} />
        <StatsCard title="OTP Requests" value={analytics?.otp_requests ?? 0} icon={Key} accent="orange" loading={analyticsLoading} />
        <StatsCard title="Votes Recorded" value={analytics?.votes_recorded ?? 0} icon={Vote} accent="green" loading={analyticsLoading} />
        <StatsCard title="Failed Verifications" value={analytics?.failed_verification_attempts ?? 0} icon={AlertTriangle} accent="red" loading={analyticsLoading} />
        <StatsCard title="Suspicious Events" value={analytics?.suspicious_events ?? 0} icon={AlertTriangle} accent="red" loading={analyticsLoading} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
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

        <ChartCard title="OTP Requests">
          {analyticsLoading ? (
            <ChartFallback />
          ) : (analytics?.otp_requests_over_time ?? []).length === 0 ? (
            <EmptyState title="No OTP requests" />
          ) : (
            <ChartContainer>
              <BarChart data={analytics?.otp_requests_over_time ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={formatChartDate} fontSize={12} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </ChartCard>

        <ChartCard title="Vote Submission Timeline">
          {analyticsLoading ? (
            <ChartFallback />
          ) : (analytics?.vote_submission_timeline ?? []).length === 0 ? (
            <EmptyState title="No votes recorded" />
          ) : (
            <ChartContainer>
              <LineChart data={analytics?.vote_submission_timeline ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="timestamp" tickFormatter={formatChartDateTime} fontSize={11} />
                <YAxis allowDecimals={false} fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="votes" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ChartContainer>
          )}
        </ChartCard>
      </div>

      <div className="mb-8 rounded-2xl bg-white shadow">
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
                  <th className="p-4">Turnout</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {summary.assigned_elections.map((election) => {
                  const turnout = turnoutByElection.get(election.election_id) ?? 0;
                  return (
                    <tr key={election.election_id} className="border-t hover:bg-slate-50">
                      <td className="p-4 font-semibold">{election.title}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-slate-200">
                            <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(turnout, 100)}%` }} />
                          </div>
                          <span className="text-sm font-semibold">{turnout.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          election.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {election.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-3 text-sm">
                          <Link to={`/auditor/logs?election=${election.election_id}`} className="font-semibold text-blue-600 hover:text-blue-700">
                            Logs
                          </Link>
                          <Link to={`/auditor/reports?election=${election.election_id}`} className="font-semibold text-blue-600 hover:text-blue-700">
                            Reports
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl bg-white shadow">
          <div className="border-b p-6">
            <h2 className="text-xl font-bold">Recent Audit Logs</h2>
          </div>
          {recentLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No audit logs recorded yet.</div>
          ) : (
            <div className="divide-y">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-4">
                  <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">{log.action}</span>
                  <p className="mt-2 text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          <div className="border-t p-4">
            <Link to={`/auditor/logs?election=${selectedElectionId}`} className="text-sm font-semibold text-blue-600">
              View all audit logs →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow">
          <div className="border-b p-6">
            <h2 className="text-xl font-bold">Fraud Detection</h2>
          </div>
          {fraudLogs.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No fraud attempts detected.</div>
          ) : (
            <div className="divide-y">
              {fraudLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-red-50">
                  <span className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">{log.action}</span>
                  {log.metadata_explanation && (
                    <p className="mt-2 text-xs text-red-700">{log.metadata_explanation}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
