import { useElection } from "~/hooks/useElection";

export default function ElectionConfigurationPage() {
  const { election, loading } = useElection();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Configuration</h2>
            <p className="mt-2 text-sm text-slate-500">
              Define metadata, positions, and election timing.
            </p>
          </div>
          <button className="rounded-xl bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700">
            Edit Configuration
          </button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Election title</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election?.name ?? "N/A"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Description</p>
            <p className="mt-2 text-base text-slate-700">
              {loading ? "Loading…" : election?.description ?? "No description provided."}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Voting period</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election ? `${election.startDate} – ${election.endDate}` : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Election status</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election?.status ?? "Unknown"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
