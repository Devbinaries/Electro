import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    localStorage.removeItem("voterStudentId");
    localStorage.removeItem("voterElectionId");
    localStorage.removeItem("voterId");
    localStorage.removeItem("votingSessionToken");

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const timeout = setTimeout(() => {
      navigate("/");
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-3 py-6 sm:px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-5 text-center shadow-xl sm:p-8 md:p-12">
        {/* Success Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 sm:h-20 sm:w-20">
          <svg
            className="h-8 w-8 text-green-600 sm:h-10 sm:w-10"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">
          Vote Successfully Cast
        </h1>

        {/* Message */}
        <p className="mt-4 text-slate-600 leading-relaxed">
          Thank you for participating in the 27th SRC Elections.
          Your vote has been securely recorded and cannot be altered.
        </p>

        {/* Countdown */}
        <div className="mt-8 rounded-2xl bg-slate-100 p-4">
          <p className="text-sm text-slate-500">
            Redirecting in
          </p>

          <p className="mt-1 text-3xl font-bold text-blue-600">
            {countdown}s
          </p>
        </div>

        {/* Manual Button */}
        <button
          onClick={() => navigate("/")}
          className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
        >
          Return Home
        </button>

        {/* Footer */}
        <p className="mt-8 text-sm text-slate-400">
          Powered by Electro
        </p>
      </div>
    </div>
  );
}
