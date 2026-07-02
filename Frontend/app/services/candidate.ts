import api from "./api";

export const getCandidates = async () => {
  const response = await api.get("/api/public/elections/active/");
  return {
    electionId: response.data.election_id,
    title: response.data.title,
    positions: response.data.positions ?? [],
  };
};

export const createCandidate = async (payload: FormData) => {
  const response = await api.post("/api/elections/candidates/", payload);
  return response.data;
};

export const deleteCandidate = async (name: string) => {
  return api.delete(`/api/elections/candidates/${encodeURIComponent(name)}/`);
};
