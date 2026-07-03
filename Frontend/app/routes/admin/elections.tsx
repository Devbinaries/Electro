import { useEffect, useState } from "react";

import {
  getAdminElections,
  getAdminElectionDetail,
  getAdminUsers,
  updateElection,
} from "~/services/election";
import { getApiErrorMessage } from "~/utils/apiError";
import CreateElectionModal from "~/components/admin/CreateElectionModal";
import EditElectionModal from "~/components/admin/EditElectionModal";

type AdminElection = {
  id: number;
  election_id: string;
  title: string;
  description?: string;
  status: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
  electoral_officer?: { id: number; email: string } | null;
  auditors?: Array<{ id: number; email: string }>;
};

type ElectionDetail = {
  id: number;
  election_id: string;
  title: string;
  description?: string;
  status: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
  electoral_officer?: { id: number; email: string } | null;
  auditors?: Array<{ id: number; email: string }>;
  positions_count: number;
  candidates_count: number;
};

type StaffUser = {
  id: number;
  email: string;
  role: string;
};

const formatElectionDateTime = (value?: string) => {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function AdminElectionsPage() {
  const [elections, setElections] = useState<AdminElection[]>([]);
  const [officers, setOfficers] = useState<StaffUser[]>([]);
  const [auditors, setAuditors] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedElection, setSelectedElection] = useState<ElectionDetail | undefined>();
  const [loadingElection, setLoadingElection] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [electionRows, officerRows, auditorRows] = await Promise.all([
        getAdminElections(),
        getAdminUsers({ role: "ELECTORAL_OFFICER", page_size: 100 }),
        getAdminUsers({ role: "AUDITOR", page_size: 100 }),
      ]);

      setElections(Array.isArray(electionRows) ? electionRows : []);
      setOfficers(officerRows.results ?? []);
      setAuditors(auditorRows.results ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to load elections."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleAssignment = async (
    election: AdminElection,
    officerId: string,
    auditorIds: string[]
  ) => {
    setSavingId(election.id);
    setMessage("");
    setError("");

    try {
      await updateElection(election.id, {
        electoral_officer: officerId ? Number(officerId) : null,
        auditors: auditorIds.map((id) => Number(id)),
      });
      setMessage(`Updated assignments for ${election.title}.`);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to update election assignments."));
    } finally {
      setSavingId(null);
    }
  };

  const handleEditElection = async (electionId: number) => {
    setLoadingElection(true);
    try {
      const electionDetail = await getAdminElectionDetail(electionId);
      setSelectedElection(electionDetail);
      setShowEditModal(true);
    } catch (err) {
      setError("Failed to load election details");
    } finally {
      setLoadingElection(false);
    }
  };

  const handleSuccess = () => {
    setMessage("Operation completed successfully");
    setTimeout(() => setMessage(""), 3000);
    loadData();
  };

  return (
    <div className="space-y-6">
      <CreateElectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSuccess}
      />

      <EditElectionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedElection(undefined);
        }}
        onSuccess={handleSuccess}
        election={selectedElection}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Election Management</h1>
          <p className="mt-2 text-sm text-slate-500">
            Create, edit, and assign officers and auditors to elections.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          + Create Election
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">Loading elections…</div>
      ) : elections.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-slate-500 shadow">
          No elections found. Create your first election to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map((election) => (
            <ElectionCard
              key={election.id}
              election={election}
              officers={officers}
              auditors={auditors}
              saving={savingId === election.id}
              loadingElection={loadingElection}
              onSave={handleAssignment}
              onEdit={handleEditElection}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ElectionCard({
  election,
  officers,
  auditors,
  saving,
  loadingElection,
  onSave,
  onEdit,
}: {
  election: AdminElection;
  officers: StaffUser[];
  auditors: StaffUser[];
  saving: boolean;
  loadingElection: boolean;
  onSave: (election: AdminElection, officerId: string, auditorIds: string[]) => Promise<void>;
  onEdit: (electionId: number) => void;
}) {
  const [officerId, setOfficerId] = useState(String(election.electoral_officer?.id ?? ""));
  const [auditorIds, setAuditorIds] = useState(
    (election.auditors ?? []).map((auditor) => String(auditor.id))
  );

  const toggleAuditor = (id: string) => {
    setAuditorIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id].slice(0, 3)
    );
  };

  const statusColors: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700",
    LOCKED: "bg-yellow-100 text-yellow-700",
    ACTIVE: "bg-green-100 text-green-700",
    CLOSED: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">{election.title}</h2>
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColors[election.status] || 'bg-slate-100 text-slate-700'}`}>
              {election.status}
            </span>
          </div>
          {election.description && (
            <p className="mt-1 text-sm text-slate-600">{election.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>Start: {formatElectionDateTime(election.start_date)}</span>
            <span>End: {formatElectionDateTime(election.end_date)}</span>
          </div>
        </div>
        <button
          type="button"
          disabled={loadingElection}
          onClick={() => onEdit(election.id)}
          className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Edit
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-700">Electoral officer</label>
          <select
            value={officerId}
            onChange={(event) => setOfficerId(event.target.value)}
            disabled={election.is_locked}
            className="mt-2 w-full rounded-xl border border-slate-200 p-3 disabled:bg-slate-100 disabled:text-slate-500"
          >
            <option value="">Unassigned</option>
            {officers.map((officer) => (
              <option key={officer.id} value={officer.id}>
                {officer.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700">Auditors (max 3)</p>
          <div className="mt-2 space-y-2 rounded-xl border border-slate-200 p-3">
            {auditors.length === 0 ? (
              <p className="text-sm text-slate-500">No auditors available.</p>
            ) : (
              auditors.map((auditor) => (
                <label key={auditor.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={auditorIds.includes(String(auditor.id))}
                    onChange={() => toggleAuditor(String(auditor.id))}
                    disabled={election.is_locked}
                  />
                  {auditor.email}
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t pt-4">
        <button
          type="button"
          disabled={saving || election.is_locked}
          onClick={() => void onSave(election, officerId, auditorIds)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : election.is_locked ? "Locked - Cannot change" : "Save assignments"}
        </button>
      </div>
    </div>
  );
}
