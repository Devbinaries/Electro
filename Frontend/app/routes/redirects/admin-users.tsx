import { Navigate } from "react-router";

export default function AdminUsersRedirect() {
  return <Navigate to="/admin/users" replace />;
}
