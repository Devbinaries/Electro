import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { verifyVotingOtp } from "~/services/voter";

export default function VoteOtpPage() {
  const navigate = useNavigate();
  const { electionId } = useParams();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const storedElectionId = localStorage.getItem("voterElectionId");
  const voterId = localStorage.getItem("voterId");
  const electionTitle = localStorage.getItem("voterElectionTitle") ?? "Election";

  useEffect(() => {
    if (!electionId || electionId !== storedElectionId || !voterId) {
      navigate(electionId ? `/vote/${electionId}` : "/");
    }
  }, [electionId, navigate, storedElectionId, voterId]);

  const code = useMemo(() => otp.join(""), [otp]);

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < updated.length - 1) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Backspace") return;

    event.preventDefault();
    const updated = [...otp];

    if (updated[index]) {
      updated[index] = "";
      setOtp(updated);
      return;
    }

    if (index > 0) {
      updated[index - 1] = "";
      setOtp(updated);
      focusInput(index - 1);
    }
  };

  const handleVerify = async () => {
    if (!electionId || !voterId) return;
    if (code.length !== 6) {
      setError("Enter the full 6-digit OTP.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await verifyVotingOtp({
        electionId,
        voterId,
        otp: code,
      });

      localStorage.setItem("votingSessionToken", response.session_token);
      localStorage.setItem("votingSessionExpiresAt", response.expires_at);
      navigate(`/vote/${electionId}/ballot`);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Unable to verify OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg md:p-8">
        <button
          onClick={() => navigate(`/vote/${electionId}`)}
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Back
        </button>

        <h1 className="mb-2 text-center text-2xl font-bold text-slate-900 md:text-3xl">
          Enter OTP
        </h1>
        <p className="mb-8 text-center text-sm text-slate-500">
          Enter the verification code displayed for `{electionTitle}`.
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 flex justify-center gap-2 md:gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-12 w-12 rounded-xl border border-slate-300 text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 md:h-14 md:w-14"
            />
          ))}
        </div>

        <button
          onClick={() => void handleVerify()}
          disabled={submitting || code.length !== 6}
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Verifying..." : "Verify OTP"}
        </button>
      </div>

      <p className="mt-6 text-sm text-slate-500">Powered by Electro</p>
    </div>
  );
}
