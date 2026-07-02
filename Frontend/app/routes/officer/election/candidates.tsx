import { useMemo, useState } from "react";

import CandidateModal from "~/components/election/CandidateModal";
import PositionModal from "~/components/election/PositionModal";
import { createCandidateRecord, createPosition, deleteCandidateRecord } from "~/services/election";
import { getApiErrorMessage } from "~/utils/apiError";
import { canManageCandidates, canManagePositions } from "~/utils/electionPermissions";
import { useElection } from "~/hooks/useElection";

type ElectionWithMeta = {
  electionPk?: number;
  positionIdByName?: Record<string, number>;
  positions?: Array<{
    position: string;
    candidates?: Array<{ id: string; name: string; photo?: string | null }>;
  }>;
};

export default function ElectionCandidatesPage() {
  const { election, loading, reloadElection } = useElection();
  const electionMeta = election as ElectionWithMeta | null;
  const [open, setOpen] = useState(false);
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const positions = Array.isArray(election?.positions) ? election.positions : [];
  const canModify = canManageCandidates(election?.status ?? "draft");
  const canAddPositions = canManagePositions(election?.status ?? "draft");

  const positionOptions = useMemo(
    () =>
      Object.entries(electionMeta?.positionIdByName ?? {}).map(([name, id]) => ({
        id,
        name,
      })),
    [electionMeta?.positionIdByName]
  );

  const handleCreateCandidate = async (payload: {
    positionId: number;
    name: string;
    photo: File | null;
  }) => {
    if (!electionMeta?.electionPk) {
      throw new Error("Election metadata unavailable.");
    }

    setActionLoading(true);
    setError("");

    try {
      await createCandidateRecord({
        election: electionMeta.electionPk,
        position: payload.positionId,
        name: payload.name,
        photo: payload.photo,
      });
      await reloadElection?.();
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to add candidate.");
      setError(message);
      throw new Error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCandidate = async (candidateName: string) => {
    setActionLoading(true);
    setError("");

    try {
      await deleteCandidateRecord(candidateName);
      await reloadElection?.();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to delete candidate."));
    } finally {
      setActionLoading(false);
    }
  };

  const getCandidatePhotoUrl = (photo?: string | null) => {
    if (!photo) {
      return null;
    }

    if (/^https?:\/\//i.test(photo)) {
      return photo;
    }

    if (photo.startsWith("/")) {
      return `${import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000"}${photo}`;
    }

    return photo;
  };

  const handleCreatePosition = async (name: string) => {
    if (!electionMeta?.electionPk) {
      throw new Error("Election metadata unavailable.");
    }

    setActionLoading(true);
    setError("");

    try {
      await createPosition({
        election: electionMeta.electionPk,
        name,
      });
      await reloadElection?.();
    } catch (err) {
      const message = getApiErrorMessage(err, "Unable to add position.");
      setError(message);
      throw new Error(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Candidates</h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage candidates by position within this election.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canAddPositions ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setPositionModalOpen(true)}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Add Position
              </button>
            ) : null}
            {canModify ? (
              <button
                type="button"
                disabled={positionOptions.length === 0 || actionLoading}
                onClick={() => setOpen(true)}
                className="rounded-xl bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                Add Candidate
              </button>
            ) : null}
          </div>
        </div>

        {!canModify && (
          <p className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
            Candidate and position management is only available while the election is in draft status.
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 space-y-6">
          {loading ? (
            <p className="text-sm text-slate-500">Loading election…</p>
          ) : positions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              <p className="font-medium text-slate-700">No positions configured yet.</p>
              <p className="mt-2">Create a position first, then add candidates for it.</p>
            </div>
          ) : (
            positions.map((position) => (
              <div key={position.position} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-semibold text-slate-900">{position.position}</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {(position.candidates ?? []).map((candidate) => {
                    const photoUrl = getCandidatePhotoUrl(candidate.photo);

                    return (
                      <div key={candidate.id} className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={candidate.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                              {candidate.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{candidate.name}</p>
                          </div>
                        </div>
                        {canModify && (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => void handleDeleteCandidate(candidate.name)}
                            className="mt-3 text-sm font-semibold text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {positionModalOpen && (
        <PositionModal
          onClose={() => setPositionModalOpen(false)}
          onSave={handleCreatePosition}
        />
      )}

      {open && positionOptions.length > 0 && (
        <CandidateModal
          positions={positionOptions}
          onClose={() => setOpen(false)}
          onSave={handleCreateCandidate}
        />
      )}
    </div>
  );
}
