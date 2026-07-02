import { Navigate } from "react-router";
import { type ReactNode } from "react";
import { useAuthStore } from "~/store/authStore";

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({
  children,
}: Props) {
  const { token } =
    useAuthStore();

  if (!token) {
    return (
      <Navigate
        to="/auth/login"
        replace
      />
    );
  }

  return <>{children}</>;
}