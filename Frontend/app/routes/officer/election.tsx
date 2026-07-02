import { NavLink, Outlet, useNavigate, useParams } from "react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import ElectionStatusBadge from "~/components/dashboard/ElectionStatusBadge";
import { getOfficerElectionDetail } from "~/services/election";
import { getVisibleElectionTabs } from "~/utils/electionPermissions";
import type { Election } from "~/types/election";

type ElectionWithLinks = Election & {
  links?: {
    voterPortal: string;
    observerPortal: string;
  };
};

export default function ElectionWorkspaceRoute() {
  const navigate = useNavigate();
  const { electionId } = useParams();

  const [election, setElection] = useState<ElectionWithLinks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const visibleTabs = useMemo(
    () => getVisibleElectionTabs((election?.status ?? "draft") as Election["status"]),
    [election?.status]
  );

  const loadElection = useCallback(async () => {
    if (!electionId) return;

    setLoading(true);
    setError("");

    try {
      const detail = await getOfficerElectionDetail(electionId);
      setElection(detail);
    } catch {
      setElection(null);
      setError("Unable to load election details.");
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    void loadElection();
  }, [loadElection]);

  if (!electionId) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Election Workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {loading ? `Election ${electionId}` : election?.name ?? `Election ${electionId}`}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span>Election ID: {electionId}</span>
            <span>•</span>
            <span>Dates: {election?.startDate ?? "—"} → {election?.endDate ?? "—"}</span>
            <span>•</span>
            <ElectionStatusBadge status={(election?.status ?? "draft") as any} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={() => navigate("/officer/elections")}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to Elections
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 shadow text-slate-500">
          Loading election details…
        </div>
      ) : !election ? (
        <div className="rounded-2xl bg-white p-6 shadow text-red-500">
          {error || "Election not found."}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow">
            <nav className="flex gap-2 md:gap-3">
              {visibleTabs.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  end={tab.path === "."}
                  className={({ isActive }) =>
                    `rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`
                  }
                >
                  {tab.name}
                </NavLink>
              ))}
            </nav>
          </div>

          <Outlet context={{ election, loading, reloadElection: loadElection }} />
        </>
      )}
    </div>
  );
}
