import { Bell, User } from "lucide-react";

import { roleLabels } from "~/utils/auth";
import { useAuthStore } from "~/store/authStore";

export default function Navbar() {
  const { user } = useAuthStore();
  const role = user?.role;

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div>
        <h2 className="font-semibold">
          {role && role !== "unknown" ? `${roleLabels[role]} Dashboard` : "Election Dashboard"}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button type="button" className="relative" aria-label="Notifications">
          <Bell size={20} />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
            <User size={18} />
          </div>

          <div>
            <p className="text-sm font-medium">{user?.name ?? "Signed in user"}</p>
            <p className="text-xs text-slate-500">{user?.email ?? ""}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
