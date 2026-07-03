import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import ConfirmationModal from "~/components/election/ConfirmationModal";
import { getVotingBallot, submitVote, validateVotingSession } from "~/services/voter";

type Candidate = {
  id: string;
  name: string;
  department: string;
  photo: string | null;
};

type Position = {
  id: string;
  position: string;
  candidates: Candidate[];
};

export default function VoteBallotPage() {
  const navigate = useNavigate();
  const { electionId } = useParams();
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [electionTitle, setElectionTitle] = useState(
    localStorage.getItem("voterElectionTitle") ?? "Election Ballot"
  );

  const sessionToken = localStorage.getItem("votingSessionToken");
  const storedElectionId = localStorage.getItem("voterElectionId");

  useEffect(() => {
    const loadBallot = async () => {
      if (!electionId || !sessionToken || storedElectionId !== electionId) {
        navigate(electionId ? `/vote/${electionId}` : "/");
        return;
      }

      setLoading(true);
      setError("");

      try {
        await validateVotingSession(sessionToken);
        const ballot = await getVotingBallot({
          electionId,
          sessionToken,
        });
        setPositions(ballot.positions ?? []);
        setElectionTitle(ballot.title);
      } catch (err: any) {
        setError(err?.response?.data?.error ?? "Unable to load ballot.");
      } finally {
        setLoading(false);
      }
    };

    void loadBallot();
  }, [electionId, navigate, sessionToken, storedElectionId]);

  const selections = useMemo(
    () =>
      positions
        .map((position) => {
          const candidateId = selectedCandidates[position.position];
          const candidate = position.candidates.find((item) => item.id === candidateId);
          return candidate
            ? {
                position: position.position,
                candidate: candidate.name,
              }
            : null;
        })
        .filter(Boolean) as Array<{ position: string; candidate: string }>,
    [positions, selectedCandidates]
  );

  const handleReview = () => {
    const missing = positions.some((position) => !selectedCandidates[position.position]);
    if (missing) {
      setError("Please select one candidate for every position.");
      return;
    }
    setError("");
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!electionId || !sessionToken) {
      navigate(electionId ? `/vote/${electionId}` : "/");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await submitVote({
        electionId,
        sessionToken,
        votes: positions.map((position) => ({
          positionId: position.id,
          candidateId: selectedCandidates[position.position],
        })),
      });

      localStorage.setItem("voteReceiptId", response.receipt_id);
      localStorage.setItem("voteSubmittedAt", response.submitted_at);
      localStorage.setItem("voteElectionTitle", response.election);
      localStorage.removeItem("votingSessionToken");
      localStorage.removeItem("votingSessionExpiresAt");
      navigate(`/vote/${electionId}/receipt`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to submit vote.");
      setShowConfirmation(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 rounded-2xl bg-white p-4 shadow sm:mb-6 sm:p-6">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{electionTitle}</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">Select one candidate for each position.</p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-6 text-center text-slate-600 shadow">
            Loading ballot...
          </div>
        ) : (
          positions.map((position) => {
            const selectedCandidate = selectedCandidates[position.position] || "";

            return (
              <div key={position.id} className="mb-4 rounded-2xl bg-white p-4 shadow sm:mb-6 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-slate-800 sm:text-xl">{position.position}</h2>

                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  {position.candidates.map((candidate) => {
                    const isSelected = selectedCandidate === candidate.id;
                    const isDisabled = Boolean(selectedCandidate && !isSelected);

                    return (
                      <label
                        key={candidate.id}
                        className={`flex h-full cursor-pointer flex-row items-center gap-3 rounded-xl border p-3 transition sm:flex-col sm:items-stretch sm:justify-between sm:p-4 ${
                          isSelected
                            ? "border-blue-600 bg-blue-50"
                            : isDisabled
                              ? "border-slate-100 bg-slate-50 cursor-not-allowed opacity-50"
                              : "border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          {candidate.photo && (
                            <div className="mb-0 flex shrink-0 justify-center sm:mb-3">
                              <img
                                src={candidate.photo}
                                alt={candidate.name}
                                className="h-16 w-16 rounded-full object-cover sm:h-32 sm:w-32"
                              />
                            </div>
                          )}
                          <h3 className={`break-words font-semibold ${isDisabled ? "text-slate-400" : "text-slate-900"}`}>
                            {candidate.name}
                          </h3>
                          <p className={`mt-2 text-sm ${isDisabled ? "text-slate-400" : "text-slate-500"}`}>
                            {candidate.department}
                          </p>
                        </div>

                        <input
                          type="radio"
                          name={position.position}
                          checked={isSelected}
                          onChange={() =>
                            setSelectedCandidates((current) => ({
                              ...current,
                              [position.position]: candidate.id,
                            }))
                          }
                          disabled={isDisabled}
                          className="h-5 w-5 shrink-0 disabled:cursor-not-allowed sm:mt-4 sm:self-end"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        <button
          onClick={handleReview}
          disabled={loading || submitting || positions.length === 0}
          className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {submitting ? "Submitting..." : "Review Vote"}
        </button>
      </div>

      <ConfirmationModal
        isOpen={showConfirmation}
        selections={selections}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
