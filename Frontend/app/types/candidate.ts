export interface Candidate {
  id: string;

  name: string;

  studentId: string;

  department: string;

  level: string;

  manifesto: string;

  positionId: string;

  photo?: string;

  status:
    | "pending"
    | "approved"
    | "rejected";
}