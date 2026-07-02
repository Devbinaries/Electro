import { Outlet } from "react-router";

import { RequireRole } from "~/components/auth/RouteGuards";
import DashboardLayout from "~/components/layout/DashboardLayout";

export default function AdminLayoutRoute() {
  return (
    <RequireRole allowedRoles={["admin"]}>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </RequireRole>
  );
}