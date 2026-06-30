import { create } from "zustand";

export const useElectionWizardStore =
  create((set) => ({
    title: "",
    description: "",

    startDate: "",
    endDate: "",

    positions: [],
    candidates: [],

    setData: (
      payload: any
    ) =>
      set((state: any) => ({
        ...state,
        ...payload,
      })),

    reset: () =>
      set({
        title: "",
        description: "",

        startDate: "",
        endDate: "",

        positions: [],
        candidates: [],
      }),
  }));