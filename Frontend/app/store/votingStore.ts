import { create } from "zustand";

interface VoteSelection {
  [positionId: string]: string;
}

interface VotingState {
  electionId: string;
  studentId: string;
  verified: boolean;

  selections: VoteSelection;

  setStudentId: (id: string) => void;

  setVerified: (value: boolean) => void;

  selectCandidate: (
    positionId: string,
    candidateId: string
  ) => void;

  resetVoting: () => void;
}

export const useVotingStore =
  create<VotingState>((set) => ({
    electionId: "",
    studentId: "",
    verified: false,

    selections: {},

    setStudentId: (id) =>
      set({
        studentId: id,
      }),

    setVerified: (value) =>
      set({
        verified: value,
      }),

    selectCandidate: (
      positionId,
      candidateId
    ) =>
      set((state) => ({
        selections: {
          ...state.selections,
          [positionId]: candidateId,
        },
      })),

    resetVoting: () =>
      set({
        studentId: "",
        verified: false,
        selections: {},
      }),
  }));