import { useElection } from "~/hooks/useElection";
import { useNavigate } from "react-router";



// Results demo data kept as fallback; real data would be fetched/derived from votes.
const resultsFallback = [
  {
    position: "President",
    data: [
      { name: "John Doe", votes: 1500, share: "60%" },
      { name: "Jane Smith", votes: 1000, share: "40%" },
    ],
  },
  {
    position: "Secretary",
    data: [
      { name: "Amina Yusuf", votes: 1300, share: "52%" },
      { name: "Liam Carter", votes: 1200, share: "48%" },
    ],
  },
];

export default function ElectionResultsPage() {

  const navigate = useNavigate();

  const { election, loading } = useElection();
  {console.log(election)}
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Results</h2>
            <p className="mt-2 text-sm text-slate-500">
              Generate, preview, and publish election outcomes.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading election…"
                : election
                ? `Election: ${election.name}`
                : "Election details unavailable."}
            </p>
          </div>
          {election?.status === "completed" ? <button className="rounded-xl bg-blue-600 px-5 py-3 text-white transition hover:bg-blue-700" onClick={() => navigate("/observer/results")}>
            View Results
          </button> : <p className="text-sm text-slate-500 pr-4">Results not available yet.</p>}
          
        </div>

        <div className="mt-6 space-y-6">
          {((election?.positions ?? []) as any[]).length > 0
            ? (election!.positions as any[]).map((position: any) => (
                <div key={position.position} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-semibold text-slate-900">{position.position}</h3>
                  <div className="mt-4 space-y-3">
                    {(position.candidates ?? []).map((candidate: any) => (
                      <div key={candidate.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{candidate.name}</p>
                          <p className="text-sm text-slate-500">—</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">—</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : resultsFallback.map((position) => (
                <div key={position.position} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-lg font-semibold text-slate-900">{position.position}</h3>
                  <div className="mt-4 space-y-3">
                    {position.data.map((candidate) => (
                      <div key={candidate.name} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                        <div>
                          <p className="font-semibold text-slate-900">{candidate.name}</p>
                          <p className="text-sm text-slate-500">{candidate.votes} votes</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{candidate.share}</span>
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
