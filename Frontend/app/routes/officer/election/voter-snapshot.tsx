import { useElection } from "~/hooks/useElection";

const snapshot = {
  uploadedAt: "2027-02-20 14:12",
  processed: true,
  invalidRows: 12,
};

export default function ElectionVoterSnapshotPage() {
  const { election, loading } = useElection();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Voter Snapshot</h2>
            <p className="mt-2 text-sm text-slate-500">
              Read-only summary of voter upload and eligibility data.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
            Processed
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Uploaded</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {snapshot.uploadedAt}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Eligible Voters</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election?.eligibleVoters?.toLocaleString() ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Invalid Rows</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {snapshot.invalidRows}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Data Source</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">CSV upload</p>
          </div>
        </div>
      </div>
    </div>
  );
}
