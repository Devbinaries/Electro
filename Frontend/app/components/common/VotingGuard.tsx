import { Navigate } from "react-router";

interface Props {
  hasVoted: boolean;
  children: React.ReactNode;
}

export default function VotingGuard({
  hasVoted,
  children,
}: Props) {
  if (hasVoted) {
    return (
      <Navigate
        to="/voter/thank-you"
        replace
      />
    );
  }

  return <>{children}</>;
}