export type ElectionStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "counting"
  | "completed"
  | "archived";

export interface Election {
  id: string;
  name: string;
  description?: string;
  status: ElectionStatus;
  startDate: string;
  endDate: string;
  // Either a simple count or an array of positions with candidates
  positions: number | ElectionPosition[];
  eligibleVoters: number;
}

export interface ElectionPosition {
  position: string;
  candidates: Array<{
    id: string;
    name: string;
    department?: string;
  }>;
}