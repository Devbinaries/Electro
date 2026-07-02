import { useEffect, useState } from "react";

import { getAdminActivity } from "~/services/election";

type ActivityLog = {
  id: number;
  election_title: string;
  voter_student_id?: string | null;
  action: string;
  timestamp: string;
};

export default function SnapshotsPage() {
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);
  const [fraudLogs, setFraudLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminActivity()
      .then((activity) => {
        setAuditLogs(activity.audit_logs ?? []);
        setFraudLogs(activity.fraud_logs ?? []);
      })
      .catch(() => {
        setError("Unable to load system activity.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">System Activity</h1>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">Loading activity…</div>
      ) : (
        <>
          <div className="rounded-2xl bg-white shadow">
            <div className="border-b p-5">
              <h2 className="text-xl font-semibold text-slate-800">Recent audit events</h2>
            </div>
            <div className="divide-y">
              {auditLogs.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">No audit events found.</p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-5">
                    <div>
                      <h3 className="font-semibold text-slate-900">{log.action}</h3>
                      <p className="text-sm text-slate-500">{log.election_title}</p>
                      <p className="text-sm text-slate-400">
                        {log.voter_student_id ? `Voter ${log.voter_student_id}` : "System event"} ·{" "}
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white shadow">
            <div className="border-b p-5">
              <h2 className="text-xl font-semibold text-slate-800">Fraud attempts</h2>
            </div>
            <div className="divide-y">
              {fraudLogs.length === 0 ? (
                <p className="p-5 text-sm text-slate-500">No fraud attempts found.</p>
              ) : (
                fraudLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-5">
                    <div>
                      <h3 className="font-semibold text-slate-900">{log.action}</h3>
                      <p className="text-sm text-slate-500">{log.election_title}</p>
                      <p className="text-sm text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
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
