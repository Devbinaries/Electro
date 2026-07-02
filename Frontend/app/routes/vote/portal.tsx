import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import api from "~/services/api";
import { requestVotingOtp, verifyVotingOtp, createVotingSession } from "~/services/voter";

export default function VotePortalPage() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("Election Voting Portal");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentId, setStudentId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [otpGenerated, setOtpGenerated] = useState(false);
  const [userOtpInput, setUserOtpInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [voterId, setVoterId] = useState("");

  useEffect(() => {
    if (!electionId) {
      setError("Invalid election link.");
      setLoading(false);
      return;
    }

    localStorage.setItem("voterElectionId", electionId);

    api
      .get(`/api/public/elections/${electionId}/`)
      .then((response) => {
        if (response.data?.title) {
          setTitle(response.data.title);
        }
        if (response.data?.status && response.data.status !== "ACTIVE") {
          setError(
            response.data.message ??
              "This election is not currently open for voting."
          );
        }
      })
      .catch(() => {
        setError("Unable to load election details.");
      })
      .finally(() => setLoading(false));
  }, [electionId]);

  useEffect(() => {
    if (!otpGenerated || otpExpiry === null) return;

    const interval = setInterval(() => {
      setOtpExpiry((current) => {
        if (current === null || current <= 1) {
          clearInterval(interval);
          setOtpGenerated(false);
          return null;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [otpGenerated, otpExpiry]);

  const otpTimerLabel = useMemo(() => {
    if (otpExpiry === null) return "";
    const minutes = Math.floor(otpExpiry / 60);
    const seconds = otpExpiry % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [otpExpiry]);

  const handleRequestOtp = async () => {
    if (!electionId) return;
    const trimmedId = studentId.trim();
    if (!trimmedId) {
      setError("Please enter your student ID.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await requestVotingOtp({
        electionId,
        studentId: trimmedId,
      });

      localStorage.setItem("voterStudentId", trimmedId);
      localStorage.setItem("voterElectionId", response.election_id);
      localStorage.setItem("voterId", response.voter_id);
      localStorage.setItem("voterElectionTitle", response.election_title);
      localStorage.removeItem("votingSessionToken");
      localStorage.removeItem("votingSessionExpiresAt");
      setVoterId(response.voter_id);
      setOtpCode(response.verification_code);
      setOtpExpiry(response.expires_in);
      setOtpGenerated(true);
      setUserOtpInput("");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to generate OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyOtp = async () => {
    if (!otpCode) return;
    await navigator.clipboard.writeText(otpCode);
  };

  const handleVerifyOtp = async () => {
    if (!electionId || !voterId) {
      setError("Session data missing. Please start over.");
      return;
    }

    if (!userOtpInput.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const response = await verifyVotingOtp({
        electionId,
        voterId,
        otp: userOtpInput.trim(),
      });

      localStorage.setItem("votingSessionToken", response.session_token);
      localStorage.setItem("votingSessionExpiresAt", response.expires_at);

      const sessionResponse = await createVotingSession({
        electionId,
        voterId,
      });

      localStorage.setItem("votingSessionToken", sessionResponse.session_token);
      navigate(`/vote/${electionId}/ballot`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to verify OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg md:p-10">
        <h1 className="mb-6 text-center text-3xl font-bold text-slate-900 md:text-5xl">
          {loading ? "Loading…" : title}
        </h1>

        <p className="mb-8 text-center text-sm leading-relaxed text-slate-600 md:text-base">
          Welcome to the secure voting portal. Verify your student ID and enter the OTP to cast your ballot.
        </p>

        {error ? (
          <div className="mb-6 rounded-xl bg-red-50 p-4 text-center text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {/* STEP 1: Student ID Input */}
        {!otpGenerated && (
          <div className="mx-auto max-w-md">
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Enter your student ID
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="Student ID"
              disabled={submitting}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />

            <button
              onClick={() => void handleRequestOtp()}
              disabled={loading || submitting}
              className="mt-6 w-full rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Generating OTP..." : "Generate OTP"}
            </button>
          </div>
        )}

        {/* STEP 2: OTP Display & Input */}
        {otpGenerated && (
          <div className="mx-auto max-w-md">
            {/* OTP Display */}
            <div className="mb-8">
              <p className="mb-2 text-sm font-medium text-slate-700">
                Your Verification Code
              </p>
              <div className="rounded-2xl bg-slate-100 p-6 text-center">
                <p className="font-mono text-5xl font-bold tracking-[0.3em] text-slate-900">
                  {otpCode}
                </p>
              </div>
              <p className="mt-3 text-center text-sm text-slate-600">
                Expires in: <span className="font-mono font-semibold">{otpTimerLabel}</span>
              </p>
              <button
                type="button"
                onClick={() => void handleCopyOtp()}
                className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Copy Code
              </button>
            </div>

            {/* OTP Input */}
            <div>
              <label className="mb-3 block text-sm font-medium text-slate-700">
                Enter the verification code above
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={userOtpInput}
                onChange={(e) => setUserOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                disabled={verifying}
                maxLength={6}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center font-mono text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
              />

              <button
                onClick={() => void handleVerifyOtp()}
                disabled={verifying || userOtpInput.length !== 6}
                className="mt-6 w-full rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifying ? "Verifying..." : "Verify & Continue"}
              </button>

              <button
                onClick={() => {
                  setOtpGenerated(false);
                  setUserOtpInput("");
                  setOtpCode("");
                  setOtpExpiry(null);
                  setError("");
                }}
                className="mt-3 w-full rounded-lg border border-slate-200 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">Powered by Electro</p>
    </div>
  );
}
