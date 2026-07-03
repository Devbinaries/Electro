import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import ChartCard from "~/components/charts/ChartCard";
import ChartContainer from "~/components/charts/ChartContainer";
import EmptyState from "~/components/dashboard/EmptyState";
import { SkeletonChart } from "~/components/dashboard/SkeletonLoader";
import { formatChartDate } from "~/components/charts/chartTheme";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "~/components/charts/recharts";
import {
  getAuditorAnalytics,
  getAuditorFraudLogs,
  getAuditorSummary,
} from "~/services/election";
import { getApiErrorMessage } from "~/utils/apiError";

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [elections, setElections] = useState<Array<{ election_id: string; title: string }>>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof getAuditorAnalytics>> | null>(null);
  const [fraudLogs, setFraudLogs] = useState<Array<{ id: number; action: string; metadata_explanation?: string | null; timestamp: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    getAuditorSummary()
      .then((summary) => {
        if (!mounted) return;
        const assigned = summary.assigned_elections ?? [];
        setElections(assigned);
        const requested = searchParams.get("election");
        const initial =
          assigned.find((e) => e.election_id === requested)?.election_id ??
          assigned[0]?.election_id ??
          null;
        setSelectedElectionId(initial);
      })
      .catch((err) => {
        if (mounted) setError(getApiErrorMessage(err, "Unable to load auditor reports."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!selectedElectionId) {
      setAnalytics(null);
      setFraudLogs([]);
      return;
    }
    let mounted = true;
    Promise.all([
      getAuditorAnalytics(selectedElectionId),
      getAuditorFraudLogs(selectedElectionId, { page: 1, page_size: 20 }),
    ])
      .then(([analyticsData, fraud]) => {
        if (!mounted) return;
        setAnalytics(analyticsData);
        setFraudLogs(fraud.results);
      })
      .catch((err) => {
        if (mounted) setError(getApiErrorMessage(err, "Unable to load report data."));
      });
    return () => {
      mounted = false;
    };
  }, [selectedElectionId]);

  const integritySummary = useMemo(
    () => [
      { label: "Audit Events", value: analytics?.audit_events ?? 0 },
      { label: "Verification Events", value: analytics?.verification_events ?? 0 },
      { label: "Failed Verifications", value: analytics?.failed_verification_attempts ?? 0 },
      { label: "Suspicious Events", value: analytics?.suspicious_events ?? 0 },
    ],
    [analytics]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Reports</h1>
          <p className="mt-2 text-sm text-slate-500">
            Election integrity reports and audit activity.
          </p>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</p>}

      {elections.length > 0 && (
        <div className="rounded-2xl bg-white p-5 shadow">
          <label className="text-sm font-medium text-slate-700" htmlFor="report-election">
            Election
          </label>
          <select
            id="report-election"
            value={selectedElectionId ?? ""}
            onChange={(e) => {
              setSelectedElectionId(e.target.value);
              setSearchParams({ election: e.target.value });
            }}
            className="mt-2 w-full rounded-xl border border-slate-200 p-3"
          >
            {elections.map((election) => (
              <option key={election.election_id} value={election.election_id}>
                {election.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <SkeletonChart />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {integritySummary.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          <ChartCard title="Audit Events Over Time">
            {(analytics?.audit_events_over_time ?? []).length === 0 ? (
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

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Fraud Attempts</h2>
            <div className="mt-4 space-y-3">
              {fraudLogs.length === 0 ? (
                <p className="text-sm text-slate-500">No fraud attempts recorded.</p>
              ) : (
                fraudLogs.map((log) => (
                  <div key={log.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">{log.action}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {log.metadata_explanation ?? "Security event"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
