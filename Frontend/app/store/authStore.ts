import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole =
  | "admin"
  | "officer"
  | "auditor"
  | "observer"
  | "voter"
  | "unknown";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  must_change_password: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;

  login: (user: User, token: string, refreshToken?: string | null) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,

      login: (user, token, refreshToken = null) => {
        localStorage.setItem("token", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
        return set({
          user,
          token,
          refreshToken,
        });
      },

      setToken: (token) => {
        localStorage.setItem("token", token);
        return set({ token });
      },

      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("electro-auth");
        set({
          user: null,
          token: null,
          refreshToken: null,
        });
        if (typeof window !== "undefined" && window.location.pathname !== "/auth/login") {
          window.location.href = "/auth/login";
        }
      },
    }),
    {
      name: "electro-auth",
    }
  )
);
