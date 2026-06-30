import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function ThankYouPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl p-8 md:p-12 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
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
        <h1 className="mt-6 text-3xl md:text-4xl font-bold text-slate-900">
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
          className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
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