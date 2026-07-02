import { useState } from "react";
import { buildPortalUrl } from "~/utils/electionPermissions";

type ElectionAccessPanelProps = {
  electionId: string;
  voterPortalPath?: string;
  observerPortalPath?: string;
  status: string;
};

export default function ElectionAccessPanel({
  electionId,
  voterPortalPath,
  observerPortalPath,
  status,
}: ElectionAccessPanelProps) {
  const [copied, setCopied] = useState<"voter" | "observer" | null>(null);

  const voterUrl = buildPortalUrl(voterPortalPath ?? `/vote/${electionId}`);
  const observerUrl = buildPortalUrl(observerPortalPath ?? `/observer?election=${electionId}`);

  const handleCopy = async (type: "voter" | "observer", url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
      <h3 className="text-lg font-semibold text-slate-900">Election Access</h3>
      <p className="mt-1 text-sm text-slate-500">
        Share these links with voters and observers. Links are generated from the election&apos;s public ID.
      </p>

      <div className="mt-6 space-y-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Voter Portal</p>
          <p className="mt-1 text-xs text-slate-500">
            {status === "active"
              ? "Voters can verify their ID and cast ballots through this link."
              : "Available when the election is active."}
          </p>
          <p className="mt-3 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-700">
            {voterUrl}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopy("voter", voterUrl)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {copied === "voter" ? "Copied!" : "Copy Link"}
            </button>
            <a
              href={voterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Open Link
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-800">Observer Portal</p>
          <p className="mt-1 text-xs text-slate-500">
            Public read-only view of election progress and results. No login required.
          </p>
          <p className="mt-3 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-slate-700">
            {observerUrl}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleCopy("observer", observerUrl)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              {copied === "observer" ? "Copied!" : "Copy Link"}
            </button>
            <a
              href={observerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Open Link
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
