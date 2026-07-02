import { Link, useNavigate } from "react-router";

import { useAuthStore } from "~/store/authStore";

export default function Unauthorized() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleSignOut = () => {
    logout();
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-red-600">Access denied</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">You are not authorized for this dashboard.</h1>
        <p className="mt-3 text-sm text-slate-500">
          Your account does not have a supported role. Contact an administrator or sign in with a different account.
        </p>
        <div className="mt-6 flex gap-4">
          <Link to="/auth/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Return to login
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
