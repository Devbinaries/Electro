import { useState, useEffect } from "react";
import { updateAdminUser, deleteAdminUser } from "~/services/election";
import { getApiErrorMessage } from "~/utils/apiError";

type UserRole = "ADMIN" | "ELECTORAL_OFFICER" | "AUDITOR";

type EditUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    is_active: boolean;
  };
};

export default function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    role: "ELECTORAL_OFFICER" as UserRole,
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_active: user.is_active,
      });
      setError("");
      setMessage("");
    }
  }, [user, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const inputValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({
      ...prev,
      [name]: inputValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (!user) return;

    try {
      await updateAdminUser(user.id, formData);
      setMessage("User updated successfully");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update user"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      await deleteAdminUser(user.id);
      setMessage("User deleted successfully");
      setTimeout(() => {
        onSuccess();
        onClose();
        setShowDeleteConfirm(false);
      }, 1000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to delete user"));
      setShowDeleteConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg">
        <div className="border-b p-6">
          <h2 className="text-2xl font-bold text-slate-900">Edit User</h2>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
        </div>

        {showDeleteConfirm ? (
          <div className="space-y-4 p-6">
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-sm font-medium text-red-900">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-lg border border-slate-200 py-2 font-medium text-slate-700 hover:bg-slate-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
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

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-600">Email: {user.email}</p>
              <p className="text-xs text-slate-600">Username: {user.username}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="ELECTORAL_OFFICER">Electoral Officer</option>
                <option value="AUDITOR">Auditor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="rounded border-slate-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                Active
              </label>
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
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-1 rounded-lg border border-red-200 py-2 font-medium text-red-600 hover:bg-red-50"
                disabled={loading}
              >
                Delete
              </button>
              <button
                type="submit"
                className="flex-1 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
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
