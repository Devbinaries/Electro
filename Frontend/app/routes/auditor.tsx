import { Outlet } from "react-router";

import DashboardLayout from "~/components/layout/DashboardLayout";

export default function AuditorLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}