import { useOutletContext } from "react-router";
import type { Election } from "~/types/election";

export interface ElectionOutletContext {
  election: Election | null;
  loading: boolean;
}

export function useElection() {
  return useOutletContext<ElectionOutletContext>();
}
