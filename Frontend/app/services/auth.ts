import api from "./api";

interface MockUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: "admin" | "officer" | "auditor" | "observer" | "voter";
}

interface MockUserResponse {
  users: MockUser[];
}

export const loginUser = async (payload: { email: string; password: string }) => {
  const hasBackendUrl = Boolean(import.meta.env.VITE_API_URL);

  if (!hasBackendUrl) {
    const response = await fetch("/mock-users.json");
    const data = (await response.json()) as MockUserResponse;

    const matchedUser = data.users.find(
      (user) => user.email === payload.email && user.password === payload.password
    );

    if (!matchedUser) {
      throw new Error("Invalid credentials");
    }

    return {
      token: `mock-${matchedUser.role}-${matchedUser.id}`,
      user: {
        id: String(matchedUser.id),
        name: matchedUser.name,
        email: matchedUser.email,
        role: matchedUser.role,
      },
    };
  }

  const response = await api.post("/auth/login", payload);
  return response.data;
};