import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { refreshAccessToken } from "./auth";
import { useAuthStore } from "~/store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000",
});

const getStoredToken = () => {
  let token = localStorage.getItem("token");

  if (!token) {
    const persisted = localStorage.getItem("electro-auth");
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        token = parsed?.state?.token ?? parsed?.token ?? null;
      } catch {
        token = null;
      }
    }
  }

  return token;
};

const getStoredRefreshToken = () => {
  let refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    const persisted = localStorage.getItem("electro-auth");
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        refreshToken = parsed?.state?.refreshToken ?? null;
      } catch {
        refreshToken = null;
      }
    }
  }

  return refreshToken;
};

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refreshToken = getStoredRefreshToken();

      if (!refreshToken) {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      // FormData bodies cannot be replayed after the first send.
      if (originalRequest.data instanceof FormData) {
        try {
          refreshPromise ??= refreshAccessToken(refreshToken).finally(() => {
            refreshPromise = null;
          });
          const access = await refreshPromise;
          useAuthStore.getState().setToken(access);
          error.message = "Session refreshed. Please upload the file again.";
        } catch {
          useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        refreshPromise ??= refreshAccessToken(refreshToken).finally(() => {
          refreshPromise = null;
        });

        const access = await refreshPromise;
        useAuthStore.getState().setToken(access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 403) {
      error.message = "You do not have permission to perform this action.";
    }

    if (error.response?.status === 404) {
      error.message = "The requested resource was not found.";
    }

    if (error.response?.status === 500) {
      error.message = "A server error occurred. Please try again.";
    }

    return Promise.reject(error);
  }
);

export default api;
