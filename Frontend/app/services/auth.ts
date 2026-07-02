import api from "./api";
import { mapApiUser } from "~/utils/auth";

export const loginUser = async (payload: { email: string; password: string }) => {
  const response = await api.post("/api/authentication/login/", payload);
  const { access, refresh, user, token } = response.data;
  const accessToken = access ?? token;

  if (!accessToken || !user) {
    throw new Error("Invalid authentication response");
  }

  return {
    token: accessToken,
    refresh: refresh ?? null,
    user: mapApiUser(user),
  };
};

export const getCurrentUser = async () => {
  const response = await api.get("/api/authentication/me/");
  return mapApiUser(response.data);
};

export const refreshAccessToken = async (refreshToken: string) => {
  const response = await api.post("/api/authentications/token/refresh/", {
    refresh: refreshToken,
  });

  return response.data.access as string;
};
