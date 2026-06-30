import {
  LayoutDashboard,
  Users,
  Vote,
  ClipboardList,
  Settings,
  Shield,
  FileText,
  Eye,
} from "lucide-react";

export const navigation = {
  admin: [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Voters",
      path: "/admin/voters",
      icon: Users,
    },
    {
      name: "Snapshots",
      path: "/admin/snapshots",
      icon: FileText,
    },
    {
      name: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
    {
      name: "Create Election",
      path: "/officer/create-election",
      icon: ClipboardList,
    },
  ],

  officer: [
    {
      name: "Dashboard",
      path: "/officer/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Elections",
      path: "/officer/elections",
      icon: Vote,
    },
  ],

  auditor: [
    {
      name: "Dashboard",
      path: "/auditor/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Audits",
      path: "/auditor/audits",
      icon: Shield,
    },
    {
      name: "Logs",
      path: "/auditor/logs",
      icon: FileText,
    },
    {
      name: "Reports",
      path: "/auditor/reports",
      icon: ClipboardList,
    },
  ],

  observer: [
    {
      name: "Live Results",
      path: "/observer/results",
      icon: Eye,
    },
  ],
};