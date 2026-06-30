import { useElection } from "~/hooks/useElection";


export default function ElectionCandidatesPage() {
  const { election, loading } = useElection();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Candidates</h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage candidates by position within this election.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading election…"
                : election
                ? `Election: ${election.name}`
                : "Election details unavailable."}
            </p>
          </div>
          <button className="rounded-xl bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700">
            Add Candidate
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {console.log(election)}
          {(election?.positions ?? []).map((position: any) => (
            <div key={position.position} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Position</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{position.position}</h3>
                </div>
                <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-700">
                  {(position.candidates ?? []).length} candidates
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(position.candidates ?? []).map((candidate: any) => (
                  <div key={candidate.id} className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="font-semibold text-slate-900">{candidate.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{candidate.department}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
