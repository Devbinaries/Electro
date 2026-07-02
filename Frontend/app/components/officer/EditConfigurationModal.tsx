import { useState } from "react";
import { updateOfficerElectionConfiguration } from "~/services/election";
import { getApiErrorMessage } from "~/utils/apiError";
import { canEditElection } from "~/utils/electionPermissions";
import type { ElectionStatus } from "~/types/election";

type EditConfigurationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  election?: {
    id?: number;
    title: string;
    description?: string;
    status: string;
    start_date: string;
    end_date: string;
  };
  electionId: string;
};

export default function EditConfigurationModal({
  isOpen,
  onClose,
  onSuccess,
  election,
  electionId,
}: EditConfigurationModalProps) {
  const [formData, setFormData] = useState({
    title: election?.title || "",
    description: election?.description || "",
    start_date: election?.start_date || "",
    end_date: election?.end_date || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    setLoading(true);

    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setError("Start date must be before end date");
      setLoading(false);
      return;
    }

    try {
      await updateOfficerElectionConfiguration(electionId, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update configuration"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !election) return null;

  const isLocked = !canEditElection(election.status as ElectionStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
        <div className="border-b p-6">
          <h2 className="text-2xl font-bold text-slate-900">Edit Configuration</h2>
          <p className="mt-1 text-sm text-slate-600">Update election settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {isLocked && (
            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-700">
              This election is locked. Only draft elections can be edited.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              disabled={isLocked}
              required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLocked}
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Start Date *</label>
              <input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                disabled={isLocked}
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">End Date *</label>
              <input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                disabled={isLocked}
                required
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
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={loading || isLocked}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
