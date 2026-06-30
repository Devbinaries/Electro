import { useEffect, useMemo, useState } from "react";
import ResultsTable from "~/components/election/ResultsTable";
import { getElections } from "~/services/election";
import type { Election, ElectionPosition } from "~/types/election";

interface CandidateResult {
  name: string;
  votes: number;
  percentage: number;
}

function deriveResults(position: ElectionPosition) {

  const values = position.candidates.map((candidate, index) => {
    const score = candidate.name
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return Math.max(20, (score % 80) + 20 - index * 6);
  });

  const total = values.reduce((sum, value) => sum + value, 0);

  return position.candidates.map((candidate, index) => ({
    name: candidate.name,
    votes: values[index],
    percentage: Math.round((values[index] / total) * 100),
  }));
}

// function ResultsVisualizer({
//   results,
//   mode,
// }: {
//   results: CandidateResult[];
//   mode: "bar" | "column" | "pie";
// }) {
//   if (mode === "pie") {
//     let start = 0;
//     return (
//       <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
//         <h3 className="text-lg font-semibold text-slate-900">Pie chart view</h3>
//         <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-center">
//           <div
//             className="h-72 w-72 rounded-full border border-slate-200"
//             style={{
//               background: `conic-gradient(${results
//                 .map((candidate, index) => {
//                   const color = ["#2563eb", "#16a34a", "#f97316", "#8b5cf6", "#ef4444"][index % 5];
//                   const end = start + candidate.percentage;
//                   const segment = `${color} ${start}% ${end}%`;
//                   start = end;
//                   return segment;
//                 })
//                 .join(", ")})`,
//             }}
//           />

//           <div className="grid gap-3">
//             {results.map((candidate, index) => (
//               <div key={candidate.name} className="flex items-center gap-3">
//                 <span
//                   className="h-4 w-4 rounded-full"
//                   style={{
//                     background: ["#2563eb", "#16a34a", "#f97316", "#8b5cf6", "#ef4444"][index % 5],
//                   }}
//                 />
//                 <span className="font-medium text-slate-700">{candidate.name}</span>
//                 <span className="text-sm text-slate-500">{candidate.percentage}%</span>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (mode === "column") {
//     return (
//       <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
//         <h3 className="text-lg font-semibold text-slate-900">
//           Column chart
//         </h3>

//         <div className="mt-6 flex h-72 items-end justify-around gap-6">
//           {results.map((candidate) => (
//             <div key={candidate.name} className="flex flex-col items-center flex-1">
//               <span className="mb-2 text-sm font-medium">
//                 {candidate.percentage}%
//               </span>

//               <div
//                 className="w-12 rounded-t-lg bg-blue-600"
//                 style={{
//                   height: `${candidate.percentage * 2}px`,
//                 }}
//               />

//               <span className="mt-3 text-sm text-center">
//                 {candidate.name}
//               </span>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
//       <h3 className="text-lg font-semibold text-slate-900">
//         {mode === "bar" ? "Bar graph" : "Column chart"}
//       </h3>
//       <div className="mt-6 grid gap-4">
//         {results.map((candidate) => (
//           <div key={candidate.name}>
//             <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
//               <span>{candidate.name}</span>
//               <span>{candidate.percentage}%</span>
//             </div>
//             <div className="h-4 rounded-full bg-slate-100">
//               <div
//                 className="h-4 rounded-full bg-blue-600 transition-all duration-500"
//                 style={{ width: `${candidate.percentage}%` }}
//               />
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

export default function ObserverResultsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visualization, setVisualization] = useState<"bar" | "column" | "pie">("bar");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getElections()
      .then((data) => {
        setElections(data);
        const completed = data.find((election) => election.status === "completed");
        setSelectedId(completed?.id ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const completedElections = useMemo(
    () => elections.filter((election) => election.status === "completed"),
    [elections]
  );

  const selectedElection = useMemo(
    () =>
      completedElections.find((election) => election.id === selectedId) ??
      completedElections[0] ??
      null,
    [completedElections, selectedId]
  );

  const electionResults = useMemo(() => {
    if (!selectedElection || !Array.isArray(selectedElection.positions)) {
      return [] as Array<{ position: string; results: CandidateResult[] }>;
    }
    console.log("Deriving results for position:", selectedElection.positions);
    
    return selectedElection.positions.map((position) => ({
      position: position.position,
      results: deriveResults(position),
    }));
  }, [selectedElection]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <h1 className="text-3xl font-bold text-slate-900">Observer Results</h1>
          <p className="mt-2 text-slate-500">
            Review completed elections and inspect official results.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <div className="">
          {/* <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Completed elections</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    {completedElections.length}
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                  {loading ? "Loading..." : "Live"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {completedElections.map((election) => (
                <button
                  key={election.id}
                  type="button"
                  onClick={() => setSelectedId(election.id)}
                  className={`w-full rounded-3xl border p-5 text-left transition ${
                    election.id === selectedElection?.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <h3 className="font-semibold text-slate-900">{election.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">{election.description}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {new Date(election.startDate).toLocaleDateString()} — {new Date(election.endDate).toLocaleDateString()}
                  </p>
                </button>
              ))}
              {completedElections.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
                  No completed elections are available yet.
                </div>
              )}
            </div>
          </div> */}

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">
                    {selectedElection ? selectedElection.name : "Select an election"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedElection?.description ?? "Choose a completed election from the list to inspect official results."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["bar", "column", "pie"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setVisualization(mode)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        visualization === mode
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {mode === "bar" ? "Bar" : mode === "column" ? "Column" : "Pie"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {selectedElection ? (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Election status</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{selectedElection.status}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Eligible voters</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{selectedElection.eligibleVoters.toLocaleString()}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-sm text-slate-500">Positions</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{Array.isArray(selectedElection.positions) ? selectedElection.positions.length : selectedElection.positions ?? 0}</p>
                    </div>
                  </div>
                </div>

                {electionResults.length > 0 ? (
                  <div className="space-y-6">
                    {/* <ResultsVisualizer results={electionResults[0].results} mode={visualization} /> */}
                    <div className={` gap-6 ${ visualization === "pie" ? "place-items-center flex flex-wrap" : "grid"}`}>
                      {/* {console.log(electionResults)} */}
                      {electionResults.map((position) => (
                        <ResultsTable
                          key={position.position}
                          title={position.position}
                          results={position.results}
                          mode={visualization}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
                    This election does not have a detailed candidate positions list available.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
                Select a completed election from the left to inspect results.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
