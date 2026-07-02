import { useState, useEffect } from "react";
import { updateAdminElection, deleteAdminElection } from "~/services/election";
import { getApiErrorMessage } from "~/utils/apiError";

type EditElectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  election?: {
    id: number;
    election_id: string;
    title: string;
    description?: string;
    status: string;
    start_date: string;
    end_date: string;
    is_locked: boolean;
  };
};

export default function EditElectionModal({
  isOpen,
  onClose,
  onSuccess,
  election,
}: EditElectionModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (election && isOpen) {
      setFormData({
        title: election.title,
        description: election.description || "",
        start_date: election.start_date,
        end_date: election.end_date,
      });
      setError("");
      setMessage("");
    }
  }, [election, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!election) return;

    // Validate dates
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError("Start date must be before end date");
      setLoading(false);
      return;
    }

    try {
      await updateAdminElection(election.id, formData);
      setMessage("Election updated successfully");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update election"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!election) return;

    setLoading(true);
    setError("");

    try {
      await deleteAdminElection(election.id);
      setMessage("Election deleted successfully");
      setTimeout(() => {
        onSuccess();
        onClose();
        setShowDeleteConfirm(false);
      }, 1000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete election"));
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !election) return null;

  const isEditable = election.status === "DRAFT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
        <div className="border-b p-6">
          <h2 className="text-2xl font-bold text-slate-900">Edit Election</h2>
          <p className="mt-1 text-sm text-slate-600">{election.election_id}</p>
          <div className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1">
            <span className="text-xs font-medium text-blue-700">{election.status}</span>
          </div>
        </div>

        {showDeleteConfirm ? (
          <div className="space-y-4 p-6">
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm font-medium text-red-900">
                {isEditable
                  ? "Are you sure you want to delete this election? This action cannot be undone."
                  : "Only draft elections can be deleted."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Back
              </button>
              {isEditable && (
                <button
                  onClick={handleDelete}
                  className="flex-1 rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete"}
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
                {message}
              </div>
            )}

            {!isEditable && (
              <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
                Only draft elections can be edited.
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                disabled={!isEditable}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={!isEditable}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Start Date & Time</label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  disabled={!isEditable}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">End Date & Time</label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  disabled={!isEditable}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-slate-200 py-2 font-medium text-slate-700 hover:bg-slate-50"
                disabled={loading}
              >
                Close
              </button>
              {election.status === "DRAFT" && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 rounded-lg border border-red-200 py-2 font-medium text-red-600 hover:bg-red-50"
                  disabled={loading}
                >
                  Delete
                </button>
              )}
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={loading || !isEditable}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
