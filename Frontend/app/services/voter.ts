import api from "./api";

const fetchLocalVoters = async () => {
  const response = await fetch("/voters.json");
  if (!response.ok) {
    throw new Error("Unable to load local voters.json");
  }

  return response.json();
};

export const verifyStudentId = async (
  studentId: string
) => {
  try {
    const response = await api.post(
      "/api/voters/verify",
      {
        studentId,
      }
    );

    return response.data;
  } catch (error) {
    console.warn(
      "API verifyStudentId failed, falling back to public/voters.json",
      error
    );

    const voters = await fetchLocalVoters();
    const valid = voters.eligibleStudentIds.includes(studentId);
    return { valid };
  }
};

export const verifyOtp = async (
  otp: string
) => {
  const response = await api.post(
    "/api/voters/otp",
    {
      otp,
    }
  );

  return response.data;
};

const savePendingVote = async (payload: {
  studentId: string;
  selections: Array<{
    position: string;
    candidate: string;
  }>;
}) => {
  try {
    localStorage.setItem("pendingVote", JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to save pending vote", error);
  }
};

export const submitVote = async (
  studentId: string,
  selections: Array<{
    position: string;
    candidate: string;
  }>
) => {
  const payload = {
    studentId,
    selections,
  };

  try {
    const response = await api.post(
      "/api/votes",
      payload
    );

    return response.data;
  } catch (error) {
    console.warn(
      "API submitVote failed, saving pending vote to localStorage",
      error
    );

    await savePendingVote(payload);
    return { success: true, offline: true };
  }
};