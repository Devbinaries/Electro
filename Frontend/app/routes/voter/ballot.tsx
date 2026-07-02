import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import ConfirmationModal from "~/components/election/ConfirmationModal";
import { getCandidates } from "~/services/candidate";
import { submitVote } from "~/services/voter";

interface Candidate {
  id: string;
  name: string;
  department: string;
}

interface Position {
  id: string;
  position: string;
  candidates: Candidate[];
}

export default function BallotPage() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<
    Record<string, string>
  >({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [electionId, setElectionId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedElectionId = localStorage.getItem("voterElectionId");
    const storedSessionToken = localStorage.getItem("votingSessionToken");

    if (!storedElectionId || !storedSessionToken) {
      navigate("/voter/verify");
      return;
    }

    setElectionId(storedElectionId);
    setSessionToken(storedSessionToken);
  }, [navigate]);

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getCandidates();
        setPositions(data.positions ?? []);
      } catch (err) {
        console.error(err);
        setError("Unable to load candidates. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const handleReview = () => {
    const missing = positions.some(
      (position) => !selectedCandidates[position.position]
    );

    if (missing) {
      alert("Please select a candidate for every position.");
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!electionId || !sessionToken) {
      alert("Voting session is missing. Please verify again.");
      navigate("/voter/verify");
      return;
    }

    const selections = positions
      .map((position) => {
        const candidateId = selectedCandidates[position.position];
        const candidate = position.candidates.find(
          (item) => item.id === candidateId
        );

        return (
          candidate && {
            position: position.position,
            candidate: candidate.name,
          }
        );
      })
      .filter(Boolean) as Array<{
      position: string;
      candidate: string;
    }>;

    try {
      for (const selection of selections) {
        const position = positions.find((item) => item.position === selection.position);
        const candidate = position?.candidates.find((item) => item.name === selection.candidate);

        if (!position || !candidate) {
          throw new Error(`Unable to resolve the selected candidate for ${selection.position}`);
        }

        await submitVote({
          electionId,
          sessionToken,
          positionId: position.id,
          candidateId: candidate.id,
        });
      }

      localStorage.removeItem("voterStudentId");
      localStorage.removeItem("voterElectionId");
      localStorage.removeItem("voterId");
      localStorage.removeItem("votingSessionToken");

      navigate("/voter/thank-you");
    } catch (err: any) {
      console.error("Vote submission failed:", err);

      if (err.response) {
        console.log("Status:", err.response.status);
        console.log("Response:", err.response.data);
      }

      alert(err.response?.data?.message ?? err.message);
    }
  };

  const selections = positions
    .map((position) => {
      const candidateId = selectedCandidates[position.position];
      const candidate = position.candidates.find(
        (item) => item.id === candidateId
      );

      return (
        candidate && {
          position: position.position,
          candidate: candidate.name,
        }
      );
    })
    .filter(Boolean) as Array<{
    position: string;
    candidate: string;
  }>;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow">
          <h1 className="text-3xl font-bold text-slate-900">
            Ballot Paper
          </h1>

          <p className="mt-2 text-slate-600">
            Select one candidate for the position below.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-6 shadow text-center text-slate-600">
            Loading ballot...
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-6 shadow text-center text-red-600">
            {error}
          </div>
        ) : (
          positions.map((position) => {
            const selectedCandidate = selectedCandidates[position.position] || "";

            return (
              <div
                key={position.position}
                className="mb-6 rounded-2xl bg-white p-6 shadow"
              >
                <h2 className="mb-4 text-xl font-semibold text-slate-800">
                  {position.position}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  {position.candidates.map((candidate) => (
                    <label
                      key={candidate.id}
                      className={`flex h-full cursor-pointer flex-col justify-between rounded-xl border p-4 transition ${
                        selectedCandidate === candidate.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {candidate.name}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          {candidate.department}
                        </p>
                      </div>

                      <input
                        type="radio"
                        name={position.position}
                        checked={selectedCandidate === candidate.id}
                        onChange={() =>
                          setSelectedCandidates((current) => ({
                            ...current,
                            [position.position]: candidate.id,
                          }))
                        }
                        className="mt-4 h-5 w-5 self-end"
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button
            onClick={handleReview}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
          >
            Review Vote
          </button>
        </div>
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