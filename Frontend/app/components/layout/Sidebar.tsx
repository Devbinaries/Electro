import { NavLink, useNavigate } from "react-router";
import { LogOut } from "lucide-react";

import { navigation } from "~/utils/navigation";
import { useAuthStore } from "~/store/authStore";

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const role = (user?.role ?? "observer") as keyof typeof navigation;
  const links = navigation[role] ?? navigation.observer;

  return (
    <aside className="hidden md:flex w-72 flex-col border-r bg-white">
      <div className="border-b p-6">
        <h1 className="text-2xl font-bold">
          Electro
        </h1>

        <p className="text-sm text-slate-500">
          Election Platform
        </p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <li key={link.name}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-4
                    py-3
                    transition

                    ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "hover:bg-slate-100"
                    }
                  `
                  }
                >
                  <Icon size={18} />

                  {link.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t-blue-200 p-4">
        <button
          // onClick={logout}
          onClick={() => {logout(); navigate("/auth/login");}}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-600 hover:bg-red-50"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}