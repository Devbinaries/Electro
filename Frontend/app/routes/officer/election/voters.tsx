import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { getOfficerElectionVoters, getOfficerVoterDetail } from "~/services/election";
import VoterDetailModal from "~/components/officer/VoterDetailModal";
import { getApiErrorMessage } from "~/utils/apiError";

type Voter = {
  id: number;
  voter_id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  is_verified: boolean;
  has_voted: boolean;
  created_at: string;
  updated_at: string;
};

export default function ElectionVotersPage() {
  const { electionId } = useParams();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState("");
  const [votedFilter, setVotedFilter] = useState("");

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedVoter, setSelectedVoter] = useState<Voter | undefined>();
  const [loadingVoter, setLoadingVoter] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!electionId) return;

    const loadVoters = async () => {
      setLoading(true);
      setError("");

      try {
        const params: Record<string, any> = {
          page,
          page_size: pageSize,
        };

        if (search) params.search = search;
        if (verifiedFilter) params.verified = verifiedFilter === "true";
        if (votedFilter) params.voted = votedFilter === "true";

        const response = await getOfficerElectionVoters(electionId, params);
        setVoters(response.results);
        setTotal(response.count);
      } catch (err) {
        setError(getApiErrorMessage(err, "Failed to load voters"));
        setVoters([]);
      } finally {
        setLoading(false);
      }
    };

    loadVoters();
  }, [electionId, page, search, verifiedFilter, votedFilter, pageSize]);

  const handleViewVoter = async (voterId: number) => {
    if (!electionId) return;
    setLoadingVoter(true);

    try {
      const voter = await getOfficerVoterDetail(electionId, voterId);
      setSelectedVoter(voter);
      setShowDetailModal(true);
    } catch (err) {
      setError("Failed to load voter details");
    } finally {
      setLoadingVoter(false);
    }
  };

  const handleSuccess = () => {
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <VoterDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedVoter(undefined);
        }}
        onSuccess={handleSuccess}
        electionId={electionId || ""}
        voter={selectedVoter}
      />

      <div>
        <h2 className="text-2xl font-bold text-slate-900">Voters</h2>
        <p className="mt-2 text-sm text-slate-600">Manage voters and verify eligibility</p>
      </div>

      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Search</label>
            <input
              type="text"
              placeholder="Name, email, student ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Verification</label>
            <select
              value={verifiedFilter}
              onChange={(e) => {
                setVerifiedFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Voted</label>
            <select
              value={votedFilter}
              onChange={(e) => {
                setVotedFilter(e.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">All</option>
              <option value="true">Voted</option>
              <option value="false">Not Voted</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch("");
                setVerifiedFilter("");
                setVotedFilter("");
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">Loading voters...</div>
      ) : voters.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">No voters found</div>
      ) : (
        <>
          <div className="rounded-2xl bg-white shadow">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="p-4 text-left text-sm font-semibold text-slate-900">
                    Student ID
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-900">Name</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-900">
                    Verified
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-900">Voted</th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {voters.map((voter) => (
                  <tr key={voter.id} className="border-t hover:bg-slate-50">
                    <td className="p-4 text-sm font-medium text-slate-900">{voter.student_id}</td>
                    <td className="p-4 text-sm">
                      {voter.first_name} {voter.last_name}
                    </td>
                    <td className="p-4 text-sm text-slate-600">{voter.email}</td>
                    <td className="p-4 text-sm">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          voter.is_verified
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {voter.is_verified ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                          voter.has_voted ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {voter.has_voted ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      <button
                        onClick={() => handleViewVoter(voter.id)}
                        disabled={loadingVoter}
                        className="font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between rounded-2xl bg-white p-6 shadow">
            <div className="text-sm text-slate-600">
              Showing {(page - 1) * pageSize + 1} to{" "}
              {Math.min(page * pageSize, total)} of {total} voters
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, page - 2) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`rounded px-3 py-1 text-sm font-medium ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
