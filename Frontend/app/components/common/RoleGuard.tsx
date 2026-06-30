import { Navigate } from "react-router";
import type { ReactNode } from "react";
import { useAuthStore } from "~/store/authStore";
import type { UserRole } from "~/store/authStore";

interface Props {
  role: UserRole;
  children: ReactNode;
}

export default function RoleGuard({
  role,
  children,
}: Props) {
  const { user } =
    useAuthStore();

  if (!user) {
    return (
      <Navigate
        to="/auth/login"
        replace
      />
    );
  }

  if (user.role !== role) {
    return (
      <Navigate
        to="/auth/login"
        replace
      />
    );
  }

  return <>{children}</>;
}