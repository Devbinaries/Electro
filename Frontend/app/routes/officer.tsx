import { Outlet } from "react-router";

import DashboardLayout from "~/components/layout/DashboardLayout";

export default function OfficerLayoutRoute() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}