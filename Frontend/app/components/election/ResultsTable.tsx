interface CandidateResult {
  name: string;
  votes: number;
  percentage: number;
}

// interface Props {
//   title: string;
//   results: CandidateResult[];
// }

// export default function ResultsTable({
//   title,
//   results,
// }: Props) {
//   return (
//     <div className="rounded-2xl bg-white p-6 shadow">
//       <h2 className="mb-6 text-xl font-bold">
//         {title}
//       </h2>

//       <div className="space-y-5">
//         {results.map((candidate) => (
//           <div key={candidate.name}>
//             <div className="mb-2 flex justify-between">
//               <span>{candidate.name}</span>

//               <span>
//                 {candidate.percentage}%
//               </span>
//             </div>

//             <div className="h-3 rounded-full bg-slate-200">
//               <div
//                 className="h-3 rounded-full bg-blue-600 transition-all duration-500"
//                 style={{
//                   width: `${candidate.percentage}%`,
//                 }}
//               />
//             </div>

//             <p className="mt-1 text-sm text-slate-500">
//               {candidate.votes.toLocaleString()} votes
//             </p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }








type Props = {
  title: string;
  results: CandidateResult[];
  mode?: "bar" | "column" | "pie";
};

export default function ResultsTable({
  title,
  results,
  mode = "bar",
}: Props) {
  // Pie Chart
  if (mode === "pie") {
    let start = 0;

    return (
      <div className="rounded-2xl bg-white p-6 shadow flex-grow">
        <h2 className="mb-6 text-xl font-bold">{title}</h2>

        <div className="flex flex-col items-center gap-6 lg:flex-row">
          <div
            className="h-72 w-72 rounded-full"
            style={{
              background: `conic-gradient(${results
                .map((candidate, index) => {
                  const colors = [
                    "#2563eb",
                    "#16a34a",
                    "#f97316",
                    "#8b5cf6",
                    "#ef4444",
                  ];

                  const end = start + candidate.percentage;
                  const segment = `${colors[index % colors.length]} ${start}% ${end}%`;
                  start = end;
                  return segment;
                })
                .join(", ")})`,
            }}
          />

          <div className="space-y-2">
            {results.map((candidate, index) => {
              const colors = [
                "#2563eb",
                "#16a34a",
                "#f97316",
                "#8b5cf6",
                "#ef4444",
              ];

              return (
                <div
                  key={candidate.name}
                  className="flex items-center gap-3"
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{
                      background: colors[index % colors.length],
                    }}
                  />

                  <span>{candidate.name}</span>

                  <span className="text-sm text-slate-500">
                    {candidate.percentage}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Column Chart
  if (mode === "column") {
    return (
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="mb-6 text-xl font-bold">{title}</h2>

        <div className="flex h-72 items-end justify-around gap-6">
          {results.map((candidate) => (
            <div
              key={candidate.name}
              className="flex flex-1 flex-col items-center"
            >
              <span className="mb-2 text-sm font-medium">
                {candidate.percentage}%
              </span>

              <div
                className="w-12 rounded-t-lg bg-blue-600"
                style={{
                  height: `${candidate.percentage * 2}px`,
                }}
              />

              <span className="mt-3 text-center text-sm">
                {candidate.name}
              </span>

              <span className="text-xs text-slate-500">
                {candidate.votes.toLocaleString()} votes
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Horizontal Bar Graph
  return (
    <div className="rounded-2xl bg-white p-6 shadow">
      <h2 className="mb-6 text-xl font-bold">{title}</h2>

      <div className="space-y-5">
        {results.map((candidate) => (
          <div key={candidate.name}>
            <div className="mb-2 flex justify-between">
              <span>{candidate.name}</span>

              <span>{candidate.percentage}%</span>
            </div>

            <div className="h-3 rounded-full bg-slate-200">
              <div
                className="h-3 rounded-full bg-blue-600 transition-all duration-500"
                style={{
                  width: `${candidate.percentage}%`,
                }}
              />
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {candidate.votes.toLocaleString()} votes
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}