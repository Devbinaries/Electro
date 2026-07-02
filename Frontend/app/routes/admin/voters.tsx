import { useEffect, useState } from "react";

import { getAdminUsers, getAdminUserDetail } from "~/services/election";
import CreateUserModal from "~/components/admin/CreateUserModal";
import EditUserModal from "~/components/admin/EditUserModal";

type DashboardUser = {
  id: number;
  email: string;
  username: string;
  role: string;
  profile_full_name?: string | null;
  profile_department?: string | null;
};

type UserDetail = {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "ADMIN" | "ELECTORAL_OFFICER" | "AUDITOR";
  is_active: boolean;
  profile?: {
    full_name?: string;
    staff_id?: string;
    department?: string;
    is_verified?: boolean;
  };
  created_at: string;
  updated_at: string;
};

export default function VotersPage() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | undefined>();
  const [loadingUser, setLoadingUser] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminUsers({
        page_size: 100,
        ...(roleFilter ? { role: roleFilter } : {}),
      });
      setUsers(response.results ?? []);
    } catch (err) {
      setUsers([]);
      setError("Unable to load system users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    loadUsers();
    return () => {
      mounted = false;
    };
  }, [roleFilter]);

  const handleEditUser = async (userId: number) => {
    setLoadingUser(true);
    try {
      const userDetail = await getAdminUserDetail(userId);
      setSelectedUser(userDetail);
      setShowEditModal(true);
    } catch (err) {
      setError("Failed to load user details");
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSuccess = () => {
    setMessage("Operation completed successfully");
    setTimeout(() => setMessage(""), 3000);
    loadUsers();
  };

  return (
    <div className="space-y-6">
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSuccess}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUser(undefined);
        }}
        onSuccess={handleSuccess}
        user={selectedUser}
      />

      <div className="rounded-2xl bg-white shadow">
        <div className="border-b p-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">System Users</h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage staff accounts in the election system.
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              + Create User
            </button>
          </div>
        </div>

        {message && (
          <div className="border-b bg-green-50 p-5">
            <p className="text-sm text-green-700">{message}</p>
          </div>
        )}

        <div className="border-b p-5">
          <label className="text-sm font-medium text-slate-700" htmlFor="role-filter">
            Filter by role
          </label>
          <select
            id="role-filter"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="mt-2 w-full max-w-xs rounded-xl border border-slate-200 p-3"
          >
            <option value="">All roles</option>
            <option value="ADMIN">Super Admin</option>
            <option value="ELECTORAL_OFFICER">Electoral Officer</option>
            <option value="AUDITOR">Auditor</option>
          </select>
        </div>

        {error && <p className="border-b p-5 text-sm text-red-600">{error}</p>}

        {loading ? (
          <div className="p-6 text-slate-500">Loading users…</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-4 text-left text-sm font-medium text-slate-700">Name</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Email</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Role</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Department</th>
                <th className="p-4 text-left text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-slate-50">
                    <td className="p-4 text-sm">{user.profile_full_name ?? user.username}</td>
                    <td className="p-4 text-sm text-slate-600">{user.email}</td>
                    <td className="p-4 text-sm">
                      <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        {user.role === "ELECTORAL_OFFICER"
                          ? "Electoral Officer"
                          : user.role === "AUDITOR"
                            ? "Auditor"
                            : "Admin"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {user.profile_department ?? "-"}
                    </td>
                    <td className="p-4 text-sm">
                      <button
                        onClick={() => handleEditUser(user.id)}
                        disabled={loadingUser}
                        className="font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
