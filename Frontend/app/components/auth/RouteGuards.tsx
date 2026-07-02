import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

import Loader from "~/components/common/Loader";
import { useAuthBootstrap } from "~/hooks/useAuth";
import { getDashboardPathForRole } from "~/utils/auth";
import { useAuthStore, type UserRole } from "~/store/authStore";

export function AuthReady({ children }: { children: ReactNode }) {
  const { isReady } = useAuthBootstrap();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthenticatedRedirect() {
  const { user, token } = useAuthStore();

  if (user && token) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return <Outlet />;
}

export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, token } = useAuthStore();

  if (user && token) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

export function RequireRole({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
}) {
  const location = useLocation();
  const { user, token } = useAuthStore();

  if (!user || !token) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "unknown" ? "/unauthorized" : getDashboardPathForRole(user.role)} replace />;
  }

  return <>{children}</>;
}

export function RoleLanding() {
  const { user, token } = useAuthStore();

  if (user && token) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return <Navigate to="/auth/login" replace />;
}