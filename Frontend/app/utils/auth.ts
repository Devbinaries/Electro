import type { User, UserRole } from "~/store/authStore";

export const dashboardPathByRole: Record<UserRole, string> = {
  admin: "/admin",
  officer: "/officer",
  auditor: "/auditor",
  observer: "/observer",
  voter: "/voter/welcome",
  unknown: "/unauthorized",
};

export const dashboardSubdomainByRole: Partial<Record<UserRole, string>> = {
  admin: "admin",
  officer: "officer",
  auditor: "auditor",
  observer: "observer",
  voter: "voter",
};

export const normalizeRole = (role?: string | null): UserRole => {
  switch ((role ?? "").trim().toUpperCase()) {
    case "ADMIN":
    case "SUPER_ADMIN":
    case "SUPERUSER":
      return "admin";
    case "ELECTORAL_OFFICER":
    case "ELECTORAL-OFFICER":
    case "OFFICER":
      return "officer";
    case "AUDITOR":
      return "auditor";
    case "VOTER":
      return "voter";
    case "OBSERVER":
      return "observer";
    default:
      return "unknown";
  }
};

export const getDashboardPathForRole = (role?: UserRole | null) => {
  return dashboardPathByRole[role ?? "unknown"] ?? dashboardPathByRole.unknown;
};

export const roleLabels: Record<UserRole, string> = {
  admin: "Super Admin",
  officer: "Electoral Officer",
  auditor: "Auditor",
  observer: "Observer",
  voter: "Voter",
  unknown: "User",
};

export const canAccessPath = (role: UserRole, path: string) => {
  if (role === "admin") return path === "/admin" || path.startsWith("/admin/");
  if (role === "officer") return path === "/officer" || path.startsWith("/officer/");
  if (role === "auditor") return path === "/auditor" || path.startsWith("/auditor/");
  return false;
};

export const resolvePostLoginPath = (
  role: UserRole,
  requestedPath?: string | null
) => {
  if (requestedPath && canAccessPath(role, requestedPath)) {
    return requestedPath;
  }
  return getDashboardPathForRole(role);
};

export const getDashboardSubdomainForRole = (role?: UserRole | null) => {
  return dashboardSubdomainByRole[role ?? "unknown"] ?? "observer";
};

export const getDisplayName = (user: {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
}) => {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.username || user.email || "User";
};

export const mapApiUser = (user: {
  id: number | string;
  email?: string;
  username?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  must_change_password?: boolean;
}): User => ({
  id: String(user.id),
  name: getDisplayName(user),
  email: user.email ?? user.username ?? "",
  role: normalizeRole(user.role),
  must_change_password: !!user.must_change_password,
});