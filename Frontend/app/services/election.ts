import api from "./api";
import type { Election, ElectionPosition } from "~/types/election";

const normalizeStatus = (status?: string): Election["status"] => {
  switch ((status ?? "").toUpperCase()) {
    case "DRAFT":
      return "draft";
    case "LOCKED":
      return "scheduled";
    case "ACTIVE":
      return "active";
    case "CLOSED":
      return "completed";
    default:
      return "draft";
  }
};

const mapElection = (election: {
  election_id?: string;
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  positions?: Array<unknown> | number;
  voter_count?: number;
}) : Election => ({
  id: String(election.election_id ?? election.id ?? ""),
  name: election.title ?? election.name ?? "Untitled Election",
  description: election.description,
  status: normalizeStatus(election.status),
  startDate: election.start_date ?? "",
  endDate: election.end_date ?? "",
  positions: Array.isArray(election.positions) ? election.positions as Election["positions"] : [],
  eligibleVoters: election.voter_count ?? 0,
});

const mapOfficerDetailToElection = (detail: {
  id?: number;
  election_id: string;
  title: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  positions?: Array<{ id: number; name: string; description?: string; max_winners?: number }>;
  candidates?: Array<{
    id: number;
    name: string;
    position_id: number;
    position_name?: string | null;
    photo?: string | null;
  }>;
  voter_stats?: {
    total_voters?: number;
    verified_voters?: number;
    voted_voters?: number;
  };
  links?: {
    voter_portal?: string;
    observer_portal?: string;
    public_results?: string;
  };
}): Election & {
  electionPk: number;
  positionIdByName: Record<string, number>;
  links: {
    voterPortal: string;
    observerPortal: string;
    publicResults?: string;
  };
} => {
  const positions: ElectionPosition[] = (detail.positions ?? []).map((position) => ({
    position: position.name,
    candidates: (detail.candidates ?? [])
      .filter((candidate) => candidate.position_id === position.id)
      .map((candidate) => ({
        id: String(candidate.id),
        name: candidate.name,
        photo: candidate.photo ?? null,
      })),
  }));

  const positionIdByName = Object.fromEntries(
    (detail.positions ?? []).map((position) => [position.name, position.id])
  );

  return {
    id: String(detail.election_id),
    name: detail.title,
    description: detail.description,
    status: normalizeStatus(detail.status),
    startDate: detail.start_date ?? "",
    endDate: detail.end_date ?? "",
    positions,
    eligibleVoters: detail.voter_stats?.total_voters ?? 0,
    electionPk: detail.id ?? 0,
    positionIdByName,
    links: {
      voterPortal: detail.links?.voter_portal ?? `/vote/${detail.election_id}`,
      observerPortal: detail.links?.observer_portal ?? `/observer?election=${detail.election_id}`,
      publicResults: detail.links?.public_results,
    },
  };
};

export type CreateElectionPayload = Omit<Election, "id">;

export type OfficerElectionSummary = {
  assigned_elections: Array<{
    election_id: string;
    title: string;
    status: string;
    voter_count: number;
    candidate_count: number;
  }>;
  status_breakdown: Array<{ status: string; total: number }>;
};

export type ElectionResultRow = {
  position_id: string | number;
  position__name: string;
  candidate_id: string | number;
  candidate__name: string;
  total_votes: number;
};

export const getOfficerElections = async (): Promise<OfficerElectionSummary> => {
  const response = await api.get("/api/elections/officer/dashboard/summary/");
  return response.data;
};

export const getOfficerElectionDetail = async (electionId: string) => {
  const response = await api.get(`/api/elections/elections/${electionId}/`);
  return mapOfficerDetailToElection(response.data);
};

export const getOfficerElectionResults = async (electionId: string) => {
  const response = await api.get(`/api/elections/elections/${electionId}/results/`);
  return response.data as {
    election: string;
    status: string;
    results: ElectionResultRow[];
  };
};

export const lockElection = async (electionId: string) => {
  const response = await api.post(`/api/elections/elections/${electionId}/lock/`);
  return response.data;
};

export const activateElection = async (electionId: string) => {
  const response = await api.post(`/api/elections/elections/${electionId}/activate/`);
  return response.data;
};

export const closeElection = async (electionId: string) => {
  const response = await api.post(`/api/elections/elections/${electionId}/close/`);
  return response.data;
};

export const getElections = async (): Promise<Election[]> => {
  const summary = await getOfficerElections();
  return summary.assigned_elections.map((election) => mapElection(election));
};

export const createElection = async (payload: {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  electoral_officer?: number | null;
  auditors?: number[];
}) => {
  const response = await api.post("/api/elections/elections/", payload);
  return response.data as {
    id: number;
    election_id: string;
    title: string;
    status: string;
    start_date: string;
    end_date: string;
  };
};

export const updateElection = async (
  electionPk: number,
  payload: {
    title?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    electoral_officer?: number | null;
    auditors?: number[];
  }
) => {
  const response = await api.patch(`/api/elections/elections/${electionPk}/`, payload);
  return response.data;
};

export const createPosition = async (payload: {
  election: number;
  name: string;
  description?: string;
}) => {
  const response = await api.post("/api/elections/positions/", payload);
  return response.data as { id: number; name: string };
};

export const createCandidateRecord = async (payload: {
  election: number;
  position: number;
  name: string;
  photo?: File | null;
}) => {
  const formData = new FormData();
  formData.append("election", String(payload.election));
  formData.append("position", String(payload.position));
  formData.append("name", payload.name);
  if (payload.photo) {
    formData.append("photo", payload.photo);
  }

  const response = await api.post("/api/elections/candidates/", formData);
  return response.data;
};

export const deleteCandidateRecord = async (candidateName: string) => {
  return api.delete(`/api/elections/candidates/${encodeURIComponent(candidateName)}/`);
};

export const getAdminElections = async () => {
  const response = await api.get("/api/accounts/dashboard/elections/");
  return response.data;
};

export const getAdminSummary = async () => {
  const response = await api.get("/api/accounts/dashboard/summary/");
  return response.data as {
    total_users: number;
    total_elections: number;
    draft_elections: number;
    locked_elections: number;
    active_elections: number;
    closed_elections: number;
    total_electoral_officers: number;
    active_electoral_officers: number;
    total_auditors: number;
    total_registered_voters: number;
    total_votes_cast: number;
    overall_turnout_percentage: number;
  };
};

export const getAdminElectionAnalytics = async (electionId: string) => {
  const response = await api.get("/api/accounts/dashboard/analytics/", {
    params: { election_id: electionId },
  });
  return response.data as {
    election_id: string;
    title: string;
    status: string;
    positions: number;
    candidates: number;
    registered_voters: number;
    votes_cast: number;
    turnout_percentage: number;
    remaining_voters: number;
    live_turnout: { voted: number; total: number; percentage: number };
    votes_by_position: Array<{ position: string; votes: number }>;
    votes_per_candidate: Array<{
      candidate_id: number;
      candidate_name: string;
      position_name: string;
      votes: number;
    }>;
    voting_progress_over_time: Array<{ timestamp: string; votes: number }>;
    audit_events: number;
    verification_events: number;
    failed_verification_attempts: number;
    otp_requests: number;
    audit_events_over_time: Array<{ date: string; count: number }>;
    verification_breakdown: Array<{ label: string; count: number }>;
    otp_requests_over_time: Array<{ date: string; count: number }>;
    audit_action_breakdown: Array<{ action: string; count: number }>;
    recent_activity: Array<{
      id: number;
      type: string;
      election_title: string;
      voter?: string | null;
      timestamp: string;
    }>;
  };
};

export const getAdminUsers = async (params?: { role?: string; page?: number; page_size?: number }) => {
  const response = await api.get("/api/accounts/dashboard/users/", { params });
  return response.data as {
    count: number;
    page: number;
    page_size: number;
    results: Array<{
      id: number;
      email: string;
      username: string;
      role: string;
      profile_full_name?: string | null;
      profile_department?: string | null;
    }>;
  };
};

export const getAdminActivity = async () => {
  const response = await api.get("/api/accounts/dashboard/activity/");
  return response.data as {
    audit_logs: Array<{
      id: number;
      election_title: string;
      voter_student_id?: string | null;
      action: string;
      metadata?: Record<string, unknown> | null;
      timestamp: string;
    }>;
    fraud_logs: Array<{
      id: number;
      election_title: string;
      voter_student_id?: string | null;
      action: string;
      metadata?: Record<string, unknown> | null;
      timestamp: string;
    }>;
  };
};

export const getAuditorSummary = async () => {
  const response = await api.get("/api/elections/auditor/dashboard/summary/");
  return response.data as {
    assigned_elections: Array<{
      election_id: string;
      title: string;
      status: string;
      links?: {
        audit_logs?: string;
        fraud?: string;
      };
    }>;
    total_audit_logs: number;
    fraud_attempts: number;
    voter_turnout: Array<{
      election_id: string;
      title: string;
      turnout_percentage: number;
    }>;
    verification_events: number;
    otp_requests: number;
    votes_recorded: number;
    failed_verification_attempts: number;
    suspicious_events: number;
  };
};

export const getAuditorAnalytics = async (electionId?: string) => {
  const response = await api.get("/api/elections/auditor/dashboard/analytics/", {
    params: electionId ? { election_id: electionId } : undefined,
  });
  return response.data as {
    assigned_elections: number;
    audit_events: number;
    verification_events: number;
    otp_requests: number;
    votes_recorded: number;
    failed_verification_attempts: number;
    suspicious_events: number;
    audit_events_over_time: Array<{ date: string; count: number }>;
    verification_breakdown: Array<{ label: string; count: number }>;
    otp_requests_over_time: Array<{ date: string; count: number }>;
    vote_submission_timeline: Array<{ timestamp: string; votes: number }>;
    turnout_trend: Array<{ election_id: string; title: string; turnout_percentage: number }>;
  };
};

export const getAuditorAuditLogs = async (
  electionId: string,
  params?: {
    action?: string;
    search?: string;
    sort?: string;
    page?: number;
    page_size?: number;
  }
) => {
  const response = await api.get(`/api/elections/elections/${electionId}/audit-logs/`, {
    params,
  });
  return response.data as {
    count: number;
    page: number;
    page_size: number;
    results: Array<{
      id: number;
      action: string;
      voter?: { id: string; student_id: string; email: string } | null;
      metadata?: Record<string, unknown> | null;
      timestamp: string;
    }>;
  };
};

export const getAuditorFraudLogs = async (
  electionId: string,
  params?: { page?: number; page_size?: number }
) => {
  const response = await api.get(`/api/elections/elections/${electionId}/fraud/`, { params });
  return response.data as {
    count: number;
    page: number;
    page_size: number;
    results: Array<{
      id: number;
      action: string;
      metadata?: Record<string, unknown> | null;
      metadata_explanation?: string | null;
      voter?: { id: string; student_id: string; email: string } | null;
      timestamp: string;
    }>;
  };
};

export const getOfficerElectionAnalytics = async (electionId: string) => {
  const response = await api.get(`/api/elections/elections/${electionId}/analytics/`);
  return response.data as {
    election_id: string;
    title: string;
    status: string;
    positions: number;
    candidates: number;
    registered_voters: number;
    votes_cast: number;
    turnout_percentage: number;
    remaining_voters: number;
    live_turnout: { voted: number; total: number; percentage: number };
    votes_by_position: Array<{ position: string; votes: number }>;
    votes_per_candidate: Array<{
      candidate_id: number;
      candidate_name: string;
      position_name: string;
      votes: number;
    }>;
    voting_progress_over_time: Array<{ timestamp: string; votes: number }>;
  };
};

export const importVoters = async (electionId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post(`/api/voters/elections/${electionId}/import/`, formData);
  return response.data;
};

// Admin User CRUD Functions
export const createAdminUser = async (payload: {
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role: string;
  password: string;
  password_confirm: string;
}) => {
  const response = await api.post("/api/accounts/users/create/", payload);
  return response.data as {
    id: number;
    email: string;
    username: string;
    role: string;
    first_name: string;
    last_name: string;
    profile?: { full_name?: string; staff_id?: string; department?: string };
  };
};

export const getAdminUserDetail = async (userId: number) => {
  const response = await api.get(`/api/accounts/users/${userId}/`);
  return response.data as {
    id: number;
    email: string;
    username: string;
    role: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    profile?: {
      full_name?: string;
      staff_id?: string;
      department?: string;
      is_verified?: boolean;
    };
    created_at: string;
    updated_at: string;
  };
};

export const updateAdminUser = async (userId: number, payload: Partial<{
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}>) => {
  const response = await api.put(`/api/accounts/users/${userId}/`, payload);
  return response.data;
};

export const deleteAdminUser = async (userId: number) => {
  return api.delete(`/api/accounts/users/${userId}/`);
};

export const updateAdminUserProfile = async (userId: number, payload: Partial<{
  full_name: string;
  staff_id: string;
  department: string;
  is_verified: boolean;
}>) => {
  const response = await api.put(`/api/accounts/users/${userId}/profile/`, payload);
  return response.data;
};

// Admin Election CRUD Functions
export const createAdminElection = async (payload: {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
}) => {
  const response = await api.post("/api/elections/admin/elections/create/", payload);
  return response.data as {
    id: number;
    election_id: string;
    title: string;
    description?: string;
    status: string;
    start_date: string;
    end_date: string;
    created_at: string;
  };
};

export const getAdminElectionDetail = async (electionId: number) => {
  const response = await api.get(`/api/elections/admin/elections/${electionId}/`);
  return response.data as {
    id: number;
    election_id: string;
    title: string;
    description?: string;
    status: string;
    start_date: string;
    end_date: string;
    is_locked: boolean;
    electoral_officer?: { id: number; email: string } | null;
    auditors?: Array<{ id: number; email: string }>;
    positions_count: number;
    candidates_count: number;
    created_at: string;
    updated_at: string;
  };
};

export const updateAdminElection = async (electionId: number, payload: Partial<{
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}>) => {
  const response = await api.put(`/api/elections/admin/elections/${electionId}/`, payload);
  return response.data;
};

export const deleteAdminElection = async (electionId: number) => {
  return api.delete(`/api/elections/admin/elections/${electionId}/`);
};

export const updateAdminElectionStatus = async (electionId: number, status: string) => {
  const response = await api.put(`/api/elections/admin/elections/${electionId}/status/`, { status });
  return response.data;
};

export const getAdminElectionsList = async (params?: {
  status?: string;
  page?: number;
  page_size?: number;
}) => {
  const response = await api.get("/api/elections/admin/elections/", { params });
  return response.data as {
    count: number;
    page: number;
    page_size: number;
    results: Array<{
      id: number;
      election_id: string;
      title: string;
      description?: string;
      status: string;
      start_date: string;
      end_date: string;
      is_locked: boolean;
      electoral_officer?: { id: number; email: string } | null;
      auditors?: Array<{ id: number; email: string }>;
      positions_count: number;
      candidates_count: number;
      created_at: string;
      updated_at: string;
    }>;
  };
};

// Officer Voter Management Functions
export const getOfficerElectionVoters = async (
  electionId: string,
  params?: {
    search?: string;
    verified?: boolean;
    voted?: boolean;
    page?: number;
    page_size?: number;
  }
) => {
  const response = await api.get(`/api/elections/elections/${electionId}/voters/`, { params });
  return response.data as {
    count: number;
    page: number;
    page_size: number;
    results: Array<{
      id: number;
      voter_id: string;
      student_id: string;
      first_name: string;
      last_name: string;
      email: string;
      department: string;
      is_verified: boolean;
      has_voted: boolean;
      created_at: string;
      updated_at: string;
    }>;
  };
};

export const getOfficerVoterDetail = async (electionId: string, voterId: number) => {
  const response = await api.get(`/api/elections/elections/${electionId}/voters/${voterId}/`);
  return response.data as {
    id: number;
    voter_id: string;
    student_id: string;
    first_name: string;
    last_name: string;
    email: string;
    department: string;
    is_verified: boolean;
    has_voted: boolean;
    created_at: string;
    updated_at: string;
  };
};

export const updateOfficerVoterVerification = async (
  electionId: string,
  voterId: number,
  action: "verify" | "unverify"
) => {
  const response = await api.put(`/api/elections/elections/${electionId}/voters/${voterId}/verify/`, {
    action,
  });
  return response.data;
};

export const getOfficerElectionReport = async (electionId: string) => {
  const response = await api.get(`/api/elections/elections/${electionId}/report/`);
  return response.data as {
    total_voters: number;
    verified_voters: number;
    voted_voters: number;
    unverified_voters: number;
    turnout_percentage: number;
    fraud_attempts: number;
  };
};

export const getOfficerElectionConfiguration = async (electionId: string) => {
  const response = await api.get(`/api/elections/elections/${electionId}/configuration/`);
  return response.data;
};

export const updateOfficerElectionConfiguration = async (
  electionId: string,
  payload: {
    title?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
  }
) => {
  const response = await api.put(`/api/elections/elections/${electionId}/configuration/`, payload);
  return response.data;
};

export const getOfficerElectionAuditLogs = async (
  electionId: string,
  params?: {
    action?: string;
    page?: number;
    page_size?: number;
  }
) => {
  const response = await api.get(`/api/elections/elections/${electionId}/audit-logs/`, { params });
  return response.data as {
    count: number;
    page: number;
    page_size: number;
    results: Array<{
      id: number;
      election_title: string;
      voter_info?: { student_id: string; name: string } | null;
      action: string;
      metadata?: Record<string, unknown> | null;
      timestamp: string;
    }>;
  };
};

export const getOfficerElectionFraudLogs = async (
  electionId: string,
  params?: {
    page?: number;
    page_size?: number;
  }
) => {
  const response = await api.get(`/api/elections/elections/${electionId}/fraud/`, { params });
  return response.data as {
    count: number;
    page: number;
    page_size: number;
    results: Array<{
      id: number;
      election_title: string;
      voter_info?: { student_id: string; name: string } | null;
      action: string;
      metadata?: Record<string, unknown> | null;
      timestamp: string;
    }>;
  };
};
