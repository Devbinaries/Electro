import api from "./api";

// Return the positions structure expected by ballot and other pages.
export const getCandidates = async () => {
  try {
    // Fetch elections and pick the active one (or first available)
    const response = await api.get("/api/elections");
    const elections = response.data;

    if (!Array.isArray(elections) || elections.length === 0) {
      return { positions: [] };
    }

    const active = elections.find((e: any) => e.status === "active") ?? elections[0];

    return { positions: active.positions ?? [] };
  } catch (error) {
    console.warn("API getCandidates failed, falling back to public/elections.json", error);

    const response = await fetch("/elections.json");
    if (!response.ok) {
      throw new Error("Unable to load local elections.json");
    }

    const elections = await response.json();
    const active = Array.isArray(elections) ? elections.find((e: any) => e.status === "active") ?? elections[0] : null;

    return { positions: active?.positions ?? [] };
  }
};

export const createCandidate = async (payload: FormData) => {
  const response = await api.post(
    "/candidates",
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const deleteCandidate = async (id: string) => {
  return api.delete(`/candidates/${id}`);
};