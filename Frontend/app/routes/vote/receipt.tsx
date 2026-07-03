import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

export default function VoteReceiptPage() {
  const navigate = useNavigate();
  const { electionId } = useParams();

  const receiptId = localStorage.getItem("voteReceiptId");
  const submittedAt = localStorage.getItem("voteSubmittedAt");
  const electionTitle = localStorage.getItem("voteElectionTitle") ?? "Election";

  useEffect(() => {
    if (!receiptId || !electionId) {
      navigate(electionId ? `/vote/${electionId}` : "/");
    }
  }, [electionId, navigate, receiptId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-3 py-6 sm:px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-5 text-center shadow-xl sm:p-8 md:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 sm:h-20 sm:w-20">
          <svg
            className="h-8 w-8 text-green-600 sm:h-10 sm:w-10"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900 sm:text-3xl md:text-4xl">
          Vote Successfully Cast
        </h1>
        <p className="mt-4 leading-relaxed text-slate-600">
          Your vote has been securely recorded for `{electionTitle}`.
        </p>

        <div className="mt-8 space-y-4 rounded-2xl bg-slate-100 p-5 text-left">
          <div>
            <p className="text-sm text-slate-500">Election</p>
            <p className="mt-1 font-semibold text-slate-900">{electionTitle}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Receipt ID</p>
            <p className="mt-1 break-all font-mono text-sm text-slate-900">{receiptId}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Submitted At</p>
            <p className="mt-1 font-semibold text-slate-900">
              {submittedAt ? new Date(submittedAt).toLocaleString() : "Unavailable"}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="mt-8 w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}
