import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { createVotingSession, verifyOtp } from "~/services/voter";

export default function OtpPage() {
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const electionId = localStorage.getItem("voterElectionId");
  const voterId = localStorage.getItem("voterId");

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus();
  };

  const handleChange = (
    index: number,
    value: string
  ) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < 5) {
      focusInput(index + 1);
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "Backspace") return;

    event.preventDefault();
    const updated = [...otp];

    if (updated[index]) {
      updated[index] = "";
      setOtp(updated);
      focusInput(index);
      return;
    }

    if (index > 0) {
      const previousIndex = index - 1;
      updated[previousIndex] = "";
      setOtp(updated);
      focusInput(previousIndex);
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");

    if (code.length !== 6) {
      alert("Please enter the complete OTP");
      return;
    }

    try {
      if (!electionId || !voterId) {
        alert("Voting session details are missing. Please verify your student ID again.");
        navigate("/voter/verify");
        return;
      }

      const { is_verified } = await verifyOtp({ electionId, voterId, otp: code });

      if (!is_verified) {
        alert("Invalid OTP. Please try again.");
        return;
      }

      const session = await createVotingSession({ electionId, voterId });
      localStorage.setItem("votingSessionToken", String(session.session_token));

      navigate("/voter/ballot");
    } catch (error) {
      console.error(error);
      alert("Unable to verify OTP. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-3 py-6 sm:px-4 sm:py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-lg sm:p-6 md:p-8">
        <button
          onClick={() => navigate("/voter/verify")}
          className="mb-6 text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          ← Back
        </button>

        <h1 className="mb-8 text-center text-2xl font-bold text-slate-900 md:text-3xl">
          Enter the OTP
        </h1>

        <div className="mb-8 grid grid-cols-6 gap-2 sm:flex sm:justify-center md:gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              onChange={(e) =>
                handleChange(index, e.target.value)
              }
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-11 w-full min-w-0 rounded-xl border border-slate-300 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 sm:h-12 sm:w-12 sm:text-xl md:h-14 md:w-14"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Verify
        </button>
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Powered by Electro
      </p>
    </div>
  );
}
