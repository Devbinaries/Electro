import { useState } from "react";
import { Bell, User } from "lucide-react";

import Modal from "~/components/common/Modal";
import { useAuthStore } from "~/store/authStore";

export default function Navbar() {
  const { user, token, login } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");

  const handleSave = () => {
    if (!user) return;

    login(
      {
        ...user,
        name,
        email,
      },
      token ?? ""
    );
    setIsProfileOpen(false);
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-white px-6">
        <div>
          <h2 className="font-semibold">Election Dashboard</h2>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative">
            <Bell size={20} />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-slate-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
              <User size={18} />
            </div>

            <div>
              <p className="text-sm font-medium">
                {user?.name ?? "Election Officer"}
              </p>
              <p className="text-xs text-slate-500">
                {user?.email ?? "officer@electro.com"}
              </p>
            </div>
          </button>
        </div>
      </header>

      <Modal
        open={isProfileOpen}
        title="Edit Profile"
        onClose={() => setIsProfileOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Save changes
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
