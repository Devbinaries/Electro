import api from "./api";

export const requestVotingOtp = async (payload: {
  electionId: string;
  studentId: string;
}) => {
  const response = await api.post("/api/voters/verify/", {
    electionId: payload.electionId,
    studentId: payload.studentId,
  });

  return response.data as {
    success: boolean;
    verification_code: string;
    expires_in: number;
    voter_id: string;
    election_id: string;
    election_title: string;
  };
};

export const verifyStudentId = async (studentId: string, electionId?: string) => {
  const response = await api.post("/api/voters/verify-student-id/", {
    studentId,
    ...(electionId ? { electionId } : {}),
  });

  return response.data;
};

export const verifyVotingOtp = async (payload: {
  electionId: string;
  voterId: string;
  otp: string;
}) => {
  const response = await api.post(
    `/api/voters/elections/${payload.electionId}/voters/${payload.voterId}/verify-otp/`,
    {
      otp: payload.otp,
    }
  );

  return response.data as {
    success: boolean;
    is_verified: boolean;
    session_token: string;
    expires_at: string;
  };
};

export const sendOtp = async (payload: { electionId: string; voterId: string }) => {
  const response = await api.post(
    `/api/voters/elections/${payload.electionId}/voters/${payload.voterId}/send-otp/`,
    {
      voter_id: payload.voterId,
    }
  );

  return response.data;
};

export const verifyOtp = async (payload: { electionId: string; voterId: string; otp: string }) => {
  const response = await api.post(
    `/api/voters/elections/${payload.electionId}/voters/${payload.voterId}/verify-otp/`,
    {
      otp: payload.otp,
    }
  );

  return response.data;
};

export const createVotingSession = async (payload: { electionId: string; voterId: string }) => {
  const response = await api.post(
    `/api/voters/elections/${payload.electionId}/voters/${payload.voterId}/create-session/`,
    {}
  );

  return response.data;
};

export const validateVotingSession = async (token: string) => {
  const response = await api.post("/api/voters/voting-session/validate/", {
    token,
  });

  return response.data as {
    message: string;
    voter: number;
    expires_at: string;
  };
};

export const getVotingBallot = async (payload: {
  electionId: string;
  sessionToken: string;
}) => {
  const response = await api.get(`/api/public/elections/${payload.electionId}/ballot/`, {
    params: {
      session_token: payload.sessionToken,
    },
  });

  return response.data as {
    election_id: string;
    title: string;
    status: string;
    positions: Array<{
      id: string;
      position: string;
      candidates: Array<{
        id: string;
        name: string;
        department: string;
        photo: string | null;
      }>;
    }>;
  };
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
  payload: {
    electionId: string;
    sessionToken: string;
    votes: Array<{
      positionId: string;
      candidateId: string;
    }>;
  }
) => {
  const response = await api.post("/api/elections/votes/", {
    session_token: payload.sessionToken,
    election_id: payload.electionId,
    votes: payload.votes.map((vote) => ({
      position_id: vote.positionId,
      candidate_id: vote.candidateId,
    })),
  });

  return response.data as {
    success: boolean;
    message: string;
    receipt_id: string;
    submitted_at: string;
    election: string;
  };
};