import { useState } from "react";
import { updateOfficerVoterVerification } from "~/services/election";
import { getApiErrorMessage } from "~/utils/apiError";
import { canManageVoters } from "~/utils/electionPermissions";
import type { ElectionStatus } from "~/types/election";

type VoterDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  electionId: string;
  electionStatus?: ElectionStatus;
  voter?: {
    id: number;
    voter_id: string;
    student_id: string;
    first_name: string;
    last_name: string;
    email: string;
    department: string;
    is_verified: boolean;
    has_voted: boolean;
    created_at: string;
    updated_at: string;
  };
};

export default function VoterDetailModal({
  isOpen,
  onClose,
  onSuccess,
  electionId,
  electionStatus = "draft",
  voter,
}: VoterDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canVerify = canManageVoters(electionStatus);

  const handleVerification = async (action: "verify" | "unverify") => {
    if (!voter) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await updateOfficerVoterVerification(electionId, voter.id, action);
      setMessage(`Voter ${action}ed successfully`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(getApiErrorMessage(err, `Failed to ${action} voter`));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !voter) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
        <div className="border-b p-6">
          <h2 className="text-2xl font-bold text-slate-900">Voter Details</h2>
          <p className="mt-1 text-sm text-slate-600">{voter.student_id}</p>
        </div>

        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              {message}
            </div>
          )}

          <div className="space-y-3 rounded-lg bg-slate-50 p-4">
            <div>
              <p className="text-xs font-medium text-slate-600">NAME</p>
              <p className="mt-1 font-medium text-slate-900">
                {voter.first_name} {voter.last_name}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600">EMAIL</p>
              <p className="mt-1 text-slate-700">{voter.email}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600">DEPARTMENT</p>
              <p className="mt-1 text-slate-700">{voter.department}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <p className="text-xs font-medium text-slate-600">VERIFIED</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                    voter.is_verified
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {voter.is_verified ? "Yes" : "No"}
                </span>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-600">HAS VOTED</p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${
                    voter.has_voted
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {voter.has_voted ? "Yes" : "No"}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <p className="text-xs text-slate-500">
                Created: {new Date(voter.created_at).toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">
                Updated: {new Date(voter.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex gap-3 border-t pt-6">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 py-2 font-medium text-slate-700 hover:bg-slate-50"
              disabled={loading}
            >
              Close
            </button>

            {!canVerify ? (
              <p className="flex-1 text-center text-sm text-slate-500">
                Voter verification is only available in draft elections.
              </p>
            ) : !voter.is_verified ? (
              <button
                onClick={() => handleVerification("verify")}
                className="flex-1 rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Processing..." : "Verify"}
              </button>
            ) : (
              <button
                onClick={() => handleVerification("unverify")}
                className="flex-1 rounded-lg bg-yellow-600 py-2 font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Processing..." : "Unverify"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
