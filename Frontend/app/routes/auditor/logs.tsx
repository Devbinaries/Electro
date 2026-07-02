import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Search } from "lucide-react";
import { getAuditorAuditLogs, getAuditorSummary } from "~/services/election";
import { SkeletonTable } from "~/components/dashboard/SkeletonLoader";

const ACTION_OPTIONS = [
  "",
  "VOTE_CAST",
  "SESSION_CREATED",
  "SESSION_INVALIDATED",
  "ELECTION_LOCKED",
  "ELECTION_ACTIVATED",
  "ELECTION_CLOSED",
  "FRAUD_ATTEMPT",
];

type AuditLog = {
  id: number;
  action: string;
  voter?: { student_id?: string; email?: string } | null;
  timestamp: string;
};

export default function LogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [elections, setElections] = useState<Array<{ election_id: string; title: string }>>([]);
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [sort, setSort] = useState("-timestamp");
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    getAuditorSummary()
      .then((summary) => {
        if (!mounted) return;
        const assigned = summary.assigned_elections ?? [];
        setElections(assigned);
        const requestedElection = searchParams.get("election");
        const initialElection =
          assigned.find((e) => e.election_id === requestedElection)?.election_id ??
          assigned[0]?.election_id ??
          null;
        setSelectedElectionId(initialElection);
      })
      .catch(() => {
        if (mounted) setError("Unable to load assigned elections.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [searchParams]);

  const fetchLogs = useCallback(() => {
    if (!selectedElectionId) {
      setLogs([]);
      setCount(0);
      return;
    }
    setLogsLoading(true);
    setError("");
    getAuditorAuditLogs(selectedElectionId, {
      search: search || undefined,
      action: actionFilter || undefined,
      sort,
      page,
      page_size: pageSize,
    })
      .then((response) => {
        setLogs(response.results);
        setCount(response.count);
      })
      .catch(() => {
        setLogs([]);
        setCount(0);
        setError("Unable to load audit logs.");
      })
      .finally(() => setLogsLoading(false));
  }, [selectedElectionId, search, actionFilter, sort, page, pageSize]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const selectedElection = useMemo(
    () => elections.find((e) => e.election_id === selectedElectionId) ?? null,
    [elections, selectedElectionId]
  );

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const handleElectionChange = (electionId: string) => {
    setSelectedElectionId(electionId);
    setPage(1);
    setSearchParams(electionId ? { election: electionId } : {});
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white shadow">
        <div className="border-b p-5">
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="mt-2 text-sm text-slate-500">
            Search, filter, and browse activity records for assigned elections.
          </p>
        </div>

        {elections.length > 0 && (
          <div className="grid gap-4 border-b p-5 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="election-filter">
                Election
              </label>
              <select
                id="election-filter"
                value={selectedElectionId ?? ""}
                onChange={(e) => handleElectionChange(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 p-3"
              >
                {elections.map((election) => (
                  <option key={election.election_id} value={election.election_id}>
                    {election.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="action-filter">
                Action
              </label>
              <select
                id="action-filter"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 p-3"
              >
                <option value="">All actions</option>
                {ACTION_OPTIONS.filter(Boolean).map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="sort-filter">
                Sort
              </label>
              <select
                id="sort-filter"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="mt-2 w-full rounded-xl border border-slate-200 p-3"
              >
                <option value="-timestamp">Newest first</option>
                <option value="timestamp">Oldest first</option>
                <option value="action">Action A–Z</option>
                <option value="-action">Action Z–A</option>
              </select>
            </div>

            <form onSubmit={handleSearch}>
              <label className="text-sm font-medium text-slate-700" htmlFor="search-filter">
                Search
              </label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="search-filter"
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Voter ID, email, action…"
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4"
                />
              </div>
            </form>
          </div>
        )}

        {error && <p className="p-5 text-sm text-red-600">{error}</p>}

        {loading ? (
          <SkeletonTable rows={8} />
        ) : !selectedElection ? (
          <div className="p-6 text-slate-500">No assigned elections available.</div>
        ) : logsLoading ? (
          <SkeletonTable rows={8} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-sm text-slate-600">
                    <th className="p-4 font-semibold">Action</th>
                    <th className="p-4 font-semibold">Voter</th>
                    <th className="p-4 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-500">
                        No audit logs found for {selectedElection.title}.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-t hover:bg-slate-50">
                        <td className="p-4">
                          <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-sm">
                          {log.voter?.student_id ?? log.voter?.email ?? "—"}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {count > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-t p-4">
                <p className="text-sm text-slate-500">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, count)} of {count}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-3 text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
