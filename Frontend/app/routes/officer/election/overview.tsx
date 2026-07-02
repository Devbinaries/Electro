import { useState } from "react";
import { useParams } from "react-router";
import ElectionStatusBadge from "~/components/dashboard/ElectionStatusBadge";
import ElectionAccessPanel from "~/components/officer/ElectionAccessPanel";
import ElectionReportCard from "~/components/officer/ElectionReportCard";
import EditConfigurationModal from "~/components/officer/EditConfigurationModal";
import { canEditElection, canActivateElection, canCloseElection } from "~/utils/electionPermissions";
import { useElection } from "~/hooks/useElection";
import { activateElection, closeElection } from "~/services/election";

type ElectionWithLinks = {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  positions: unknown;
  eligibleVoters: number;
  links?: {
    voterPortal: string;
    observerPortal: string;
  };
};

export default function ElectionOverviewPage() {
  const { electionId } = useParams();
  const { election, loading, reloadElection } = useElection();
  const electionData = election as ElectionWithLinks | null;
  const status = electionData?.status ?? "draft";
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const runAction = async (action: "activate" | "close") => {
    if (!electionId) return;
    setActionLoading(action);
    setActionError("");
    setActionSuccess("");
    try {
      if (action === "activate") {
        await activateElection(electionId);
        setActionSuccess("Election started successfully.");
      } else {
        await closeElection(electionId);
        setActionSuccess("Election ended successfully.");
      }
      await reloadElection?.();
    } catch (err: any) {
      setActionError(err?.response?.data?.error ?? `Unable to ${action === "activate" ? "start" : "end"} election.`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <EditConfigurationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          void reloadElection?.();
        }}
        election={electionData ? {
          title: electionData.name,
          description: electionData.description,
          status: electionData.status,
          start_date: electionData.startDate,
          end_date: electionData.endDate,
        } : undefined}
        electionId={electionId || ""}
      />

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Overview</h2>
            <p className="mt-2 text-sm text-slate-500">
              Snapshot of the election's current state and key metrics.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center">
            <ElectionStatusBadge status={status as any} />
            {canEditElection(status as any) && (
              <button
                onClick={() => setShowEditModal(true)}
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 cursor-pointer"
              >
                Edit
              </button>
            )}
            {canActivateElection(status as any) && (
              <button
                disabled={actionLoading === "activate"}
                onClick={() => void runAction("activate")}
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-60 cursor-pointer animate-pulse"
              >
                {actionLoading === "activate" ? "Starting..." : "Start Election"}
              </button>
            )}
            {canCloseElection(status as any) && (
              <button
                disabled={actionLoading === "close"}
                onClick={() => void runAction("close")}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                {actionLoading === "close" ? "Ending..." : "End Election"}
              </button>
            )}
          </div>
        </div>

        {actionError && <p className="mt-4 text-sm text-red-600">{actionError}</p>}
        {actionSuccess && <p className="mt-4 text-sm text-green-600">{actionSuccess}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Start Date</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election?.startDate ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">End Date</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election?.endDate ?? "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Positions</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading
                ? "Loading…"
                : election
                ? Array.isArray(election.positions)
                  ? election.positions.length
                  : election.positions
                : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Eligible Voters</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {loading ? "Loading…" : election?.eligibleVoters?.toLocaleString() ?? "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Next step</p>
          <p className="mt-2 text-base font-semibold text-slate-900">
            {status === "draft"
              ? "Finalize configuration to schedule voting"
              : status === "scheduled"
              ? "Wait for the voting window to open"
              : status === "active"
              ? "Monitor ballots while voting is open"
              : "Review election progress."}
          </p>
        </div>
      </div>

      {electionId && electionData && (
        <ElectionAccessPanel
          electionId={electionId}
          voterPortalPath={electionData.links?.voterPortal}
          observerPortalPath={electionData.links?.observerPortal}
          status={status}
        />
      )}

      {/* Election Report Card */}
      {electionId && <ElectionReportCard electionId={electionId} />}
    </div>
  );
}
