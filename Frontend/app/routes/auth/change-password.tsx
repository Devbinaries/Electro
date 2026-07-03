import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuthStore } from "~/store/authStore";
import { changePassword } from "~/services/auth";
import Button from "~/components/common/Button";
import Card from "~/components/common/Card";
import Input from "~/components/common/Input";
import { getApiErrorMessage } from "~/utils/apiError";
import { getDashboardPathForRole } from "~/utils/auth";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, token, login, logout } = useAuthStore();
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // If not logged in, redirect to login
  if (!user || !token) {
    return <Navigate to="/auth/login" replace />;
  }

  // If password change is not required, redirect to dashboard
  if (!user.must_change_password) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });

      setSuccess(response.message || "Password updated successfully!");
      
      // Update user state in authStore
      if (response.user) {
        const currentToken = useAuthStore.getState().token;
        const currentRefreshToken = useAuthStore.getState().refreshToken;
        if (currentToken) {
          login(response.user, currentToken, currentRefreshToken);
        }
      }

      // Redirect after a brief moment to show success message
      setTimeout(() => {
        navigate(getDashboardPathForRole(user.role), { replace: true });
      }, 1500);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to update password. Please check your credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card>
        <div className="mx-auto w-full max-w-xl space-y-6 lg:w-xl">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
              Security Action Required
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">Update Password</h1>
            <p className="mt-2 text-sm text-slate-500">
              For security, you must update your temporary password before accessing your dashboard.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter temporary password"
              required
            />

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter at least 8 characters"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              placeholder="Confirm new password"
              required
            />

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full" loading={loading}>
                Update Password & Continue
              </Button>
            </div>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => logout()}
              className="text-sm font-medium text-blue-600 hover:text-blue-500 cursor-pointer"
            >
              Sign out & return to Login
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
