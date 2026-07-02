import { Navigate, useParams } from "react-router";

export default function ObserverElectionRedirect() {
  const { electionId } = useParams();
  if (!electionId) {
    return <Navigate to="/observer" replace />;
  }
  return <Navigate to={`/observer?election=${electionId}`} replace />;
}
