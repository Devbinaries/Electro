import { useEffect, useState } from "react";
import { getOfficerElectionReport } from "~/services/election";

type ElectionReportCardProps = {
  electionId: string;
};

export default function ElectionReportCard({ electionId }: ElectionReportCardProps) {
  const [report, setReport] = useState<{
    total_voters: number;
    verified_voters: number;
    voted_voters: number;
    unverified_voters: number;
    turnout_percentage: number;
    fraud_attempts: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getOfficerElectionReport(electionId)
      .then((data) => {
        if (mounted) setReport(data);
      })
      .catch(() => {
        if (mounted) setError("Failed to load report");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [electionId]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded"></div>
          <div className="h-4 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow text-red-600">
        {error || "Unable to load election report"}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h3 className="text-lg font-semibold text-slate-900">Election Report</h3>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Total Voters</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {report.total_voters}
          </p>
        </div>

        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-700">Verified Voters</p>
          <p className="mt-2 text-2xl font-bold text-green-900">
            {report.verified_voters}
          </p>
          <p className="mt-1 text-xs text-green-600">
            {Math.round((report.verified_voters / report.total_voters) * 100)}% of total
          </p>
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">Unverified Voters</p>
          <p className="mt-2 text-2xl font-bold text-yellow-900">
            {report.unverified_voters}
          </p>
          <p className="mt-1 text-xs text-yellow-600">
            {Math.round((report.unverified_voters / report.total_voters) * 100)}% of total
          </p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">Votes Cast</p>
          <p className="mt-2 text-2xl font-bold text-blue-900">
            {report.voted_voters}
          </p>
          <p className="mt-1 text-xs text-blue-600">
            {report.turnout_percentage}% turnout
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">Fraud Attempts</p>
          <p className="mt-2 text-2xl font-bold text-red-900">
            {report.fraud_attempts}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">Turnout Rate</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {report.turnout_percentage}%
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${report.turnout_percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
