import { Outlet } from "react-router";

import DashboardLayout from "~/components/layout/DashboardLayout";

export default function AdminLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}