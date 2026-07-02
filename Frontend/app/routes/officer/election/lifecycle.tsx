import { useState } from "react";
import { useParams } from "react-router";

import {
  activateElection,
  closeElection,
  lockElection,
} from "~/services/election";
import { useElection } from "~/hooks/useElection";

const lifecycleSteps = [
  { label: "Draft", status: "draft", action: null },
  { label: "Locked", status: "locked", action: "lock" as const },
  { label: "Active", status: "active", action: "activate" as const },
  { label: "Closed", status: "closed", action: "close" as const },
];

export default function ElectionLifecyclePage() {
  const { electionId } = useParams();
  const { election, loading, reloadElection } = useElection();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const currentStatus = (election?.status ?? "draft").toLowerCase();
  const activeIndex = lifecycleSteps.findIndex((step) => step.status === currentStatus);

  const runAction = async (action: "lock" | "activate" | "close") => {
    if (!electionId) return;

    setActionLoading(action);
    setError("");
    setMessage("");

    try {
      if (action === "lock") {
        await lockElection(electionId);
      } else if (action === "activate") {
        await activateElection(electionId);
      } else {
        await closeElection(electionId);
      }

      setMessage(`Election ${action}ed successfully.`);
      await reloadElection?.();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? `Unable to ${action} election.`);
    } finally {
      setActionLoading(null);
    }
  };

  const nextAction = lifecycleSteps[activeIndex + 1]?.action;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold text-slate-900">Lifecycle</h2>
        <p className="mt-2 text-sm text-slate-500">
          Control election state transitions through the backend lifecycle API.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {loading
            ? "Loading election…"
            : election
            ? `Current status: ${election.status}`
            : "Election details unavailable."}
        </p>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 text-sm text-green-600">{message}</p>}

        <div className="mt-6">
          <div className="flex items-center gap-4 overflow-x-auto">
            {lifecycleSteps.map((step, index) => {
              const isComplete = index <= activeIndex;
              return (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${
                        isComplete ? "bg-green-600" : "bg-slate-300 text-slate-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{step.label}</p>
                    </div>
                  </div>

                  {index < lifecycleSteps.length - 1 && (
                    <div className={`h-1 w-12 ${isComplete ? "bg-green-600" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {nextAction && (
          <button
            type="button"
            disabled={Boolean(actionLoading)}
            onClick={() => void runAction(nextAction)}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {actionLoading === nextAction
              ? "Processing…"
              : nextAction === "lock"
              ? "Lock Election"
              : nextAction === "activate"
              ? "Activate Election"
              : "Close Election"}
          </button>
        )}
      </div>
    </div>
  );
}
