import api from "./api";
import type { Election } from "~/types/election";

export type CreateElectionPayload = Omit<
  Election,
  "id"
>;

export const getElections = async (): Promise<Election[]> => {
  const response = await api.get("/api/elections");
  return response.data;
};

export const createElection = async (
  payload: CreateElectionPayload
): Promise<Election> => {
  const response = await api.post(
    "/api/elections",
    payload
  );

  return response.data;
};