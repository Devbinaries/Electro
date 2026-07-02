import {
  LayoutDashboard,
  Users,
  Vote,
  ClipboardList,
  Settings,
  FileText,
  Eye,
  BarChart3,
  PlusCircle,
} from "lucide-react";

import type { UserRole } from "~/store/authStore";

export const navigation: Record<
  Exclude<UserRole, "unknown" | "voter">,
  Array<{ name: string; path: string; icon: typeof LayoutDashboard }>
> = {
  admin: [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Elections", path: "/admin/elections", icon: Vote },
    { name: "Activity", path: "/admin/snapshots", icon: FileText },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ],

  officer: [
    { name: "Dashboard", path: "/officer", icon: LayoutDashboard },
    { name: "Elections", path: "/officer/elections", icon: Vote },
    { name: "Live Results", path: "/officer/live-results", icon: BarChart3 },
  ],

  auditor: [
    { name: "Dashboard", path: "/auditor", icon: LayoutDashboard },
    { name: "Audit Logs", path: "/auditor/logs", icon: FileText },
    { name: "Reports", path: "/auditor/reports", icon: ClipboardList },
  ],

  observer: [
    { name: "Results", path: "/observer", icon: BarChart3 },
  ],
};

export const publicNavigation = [
  { name: "Election Results", path: "/observer", icon: Eye },
];
