interface CandidateData {
  id?: string;
  name: string;
  department?: string;
  position?: string;
  photo?: string;
}

interface Props {
  candidate?: CandidateData;
  name?: string;
  department?: string;
  position?: string;
  photo?: string;
  selected?: boolean;
  onSelect?: () => void;
}

export default function CandidateCard({
  candidate,
  name,
  department,
  position,
  photo,
  selected = false,
  onSelect,
}: Props) {
  const candidateName = candidate?.name ?? name ?? "Unnamed candidate";
  const candidateDepartment =
    candidate?.department ?? department ?? "Unspecified department";
  const candidatePosition = candidate?.position ?? position ?? "Unspecified position";
  const candidatePhoto = candidate?.photo ?? photo;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl bg-white p-5 shadow text-left transition ${
        selected ? "ring-2 ring-blue-600" : "hover:shadow-md"
      }`}
    >
      <img
        src={candidatePhoto ?? "/placeholder.png"}
        alt={candidateName}
        className="h-32 w-32 rounded-full object-cover"
      />

      <h3 className="mt-4 text-lg font-semibold">{candidateName}</h3>

      <p>{candidatePosition}</p>

      <p className="text-slate-500">{candidateDepartment}</p>
    </button>
  );
}