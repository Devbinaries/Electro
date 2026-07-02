import { useState } from "react";
import { useParams } from "react-router";
import { useElection } from "~/hooks/useElection";
import EditConfigurationModal from "~/components/officer/EditConfigurationModal";
import { canEditElection } from "~/utils/electionPermissions";

export default function ElectionConfigurationPage() {
  const { electionId } = useParams();
  const { election, loading, reloadElection } = useElection();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleSuccess = () => {
    void reloadElection?.();
  };

  return (
    <div className="space-y-6">
      <EditConfigurationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleSuccess}
        election={election ? {
          title: election.name,
          description: election.description,
          status: election.status,
          start_date: election.startDate,
          end_date: election.endDate,
        } : undefined}
        electionId={electionId || ""}
      />

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Configuration</h2>
            <p className="mt-2 text-sm text-slate-500">
              {canEditElection(election?.status ?? "draft")
                ? "Edit election settings"
                : "View election settings (read-only after locking)"}
            </p>
          </div>
          {canEditElection(election?.status ?? "draft") && (
            <button
              onClick={() => setShowEditModal(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Edit Configuration
            </button>
          )}
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
            <div className="mt-2">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                election?.status === "draft" ? "bg-slate-100 text-slate-700" :
                election?.status === "scheduled" ? "bg-yellow-100 text-yellow-700" :
                election?.status === "active" ? "bg-green-100 text-green-700" :
                "bg-gray-100 text-gray-700"
              }`}>
                {loading ? "Loading…" : election?.status ?? "Unknown"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
