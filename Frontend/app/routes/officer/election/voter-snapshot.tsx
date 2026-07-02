import { useState } from "react";
import { useParams } from "react-router";

import { importVoters } from "~/services/election";
import { getApiErrorMessage } from "~/utils/apiError";
import { canImportVoters } from "~/utils/electionPermissions";
import { useElection } from "~/hooks/useElection";

const REQUIRED_COLUMNS = [
  "student_id",
  "first_name",
  "last_name",
  "email",
  "department",
];

export default function ElectionVoterSnapshotPage() {
  const { electionId } = useParams();
  const { election, loading, reloadElection } = useElection();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canUpload = canImportVoters(election?.status ?? "draft");

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !electionId || !canUpload) return;

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const response = await importVoters(electionId, file);
      setMessage(`Imported ${response.imported ?? 0} voters successfully.`);
      await reloadElection?.();
    } catch (err) {
      setError(getApiErrorMessage(err, "Voter import failed."));
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Voter Snapshot</h2>
            <p className="mt-2 text-sm text-slate-500">
              Upload voter lists and review eligibility totals.
            </p>
          </div>
        </div>

        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {!canUpload && (
          <p className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
            Voter list uploads are only available while the election is in draft status.
          </p>
        )}

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">CSV / Excel requirements</p>
          <p className="mt-1">
            Required columns: {REQUIRED_COLUMNS.join(", ")}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Eligible Voters</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election?.eligibleVoters?.toLocaleString() ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Election Status</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election?.status ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Positions</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading
                ? "Loading…"
                : Array.isArray(election?.positions)
                ? election.positions.length
                : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Import Voters</p>
            <input
              type="file"
              accept=".csv,.xlsx"
              disabled={uploading || !canUpload}
              onChange={(event) => void handleUpload(event)}
              className="mt-2 w-full text-sm disabled:cursor-not-allowed disabled:opacity-50"
            />
            {uploading && <p className="mt-2 text-xs text-slate-500">Uploading…</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
