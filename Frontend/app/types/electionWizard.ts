export interface ElectionWizard {
  title: string;
  description: string;

  startDate: string;
  endDate: string;

  positions: Position[];

  candidates: Candidate[];
}

export interface Position {
  id: string;
  name: string;
  slots: number;
}

export interface Candidate {
  id: string;

  name: string;

  department: string;

  positionId: string;

  photo?: string;
}