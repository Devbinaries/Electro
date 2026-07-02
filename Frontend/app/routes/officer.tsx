import { Outlet } from "react-router";

import { RequireRole } from "~/components/auth/RouteGuards";
import DashboardLayout from "~/components/layout/DashboardLayout";

export default function OfficerLayoutRoute() {
  return (
    <RequireRole allowedRoles={["officer"]}>
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    </RequireRole>
  );
}