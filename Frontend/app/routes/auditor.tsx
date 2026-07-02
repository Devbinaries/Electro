import { Outlet } from "react-router";

import { RequireRole } from "~/components/auth/RouteGuards";
import DashboardLayout from "~/components/layout/DashboardLayout";

export default function AuditorLayoutRoute() {
  return (
    <RequireRole allowedRoles={["auditor"]}>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </RequireRole>
  );
}