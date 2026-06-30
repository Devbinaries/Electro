import CandidateCard
from "./CandidateCard";

export default function PositionSection({
  position,
  selections = {},
  selectCandidate,
}: any) {
  const candidates = position?.candidates ?? [];

  return (
    <div>
      <h2>{position?.name ?? "Position"}</h2>

      {candidates.map((candidate: any) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          selected={selections?.[position?.id] === candidate.id}
          onSelect={() => selectCandidate?.(position?.id, candidate.id)}
        />
      ))}
    </div>
  );
}