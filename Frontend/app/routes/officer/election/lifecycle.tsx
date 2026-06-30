import { useElection } from "~/hooks/useElection";

const lifecycleSteps = [
  {
    label: "Draft",
    // description: "Configure election details and positions.",
  },
  {
    label: "Locked",
    // description: "Freeze settings before opening voting.",
  },
  {
    label: "Open",
    // description: "Open voting for eligible voters.",
  },
  {
    label: "Close",
    // description: "Close voting once the schedule ends.",
  },
  {
    label: "Results",
    // description: "Generate and preview results.",
  },
  {
    label: "Publish",
    // description: "Publish official election results.",
  },
];

export default function ElectionLifecyclePage() {
  const { election, loading } = useElection();

  const currentStatus = election?.status ?? "draft";
  const activeIndex = lifecycleSteps.findIndex(
    (step) => step.label.toLowerCase() === currentStatus.toLowerCase()
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-2xl font-semibold text-slate-900">Lifecycle</h2>
        <p className="mt-2 text-sm text-slate-500">
          Control election state transitions and available actions.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          {loading
            ? "Loading election…"
            : election
            ? `Current status: ${election.status}`
            : "Election details unavailable."}
        </p>

        <div className="mt-6">
          <div className="flex items-center gap-4 overflow-x-auto">
            {lifecycleSteps.map((step, index) => {
              const isComplete = index <= activeIndex;
              return (
                <div key={step.label} className="flex items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${
                        isComplete ? "bg-green-600" : "bg-slate-300 text-slate-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{step.label}</p>
                      {/* <p className="mt-1 text-sm text-slate-500">{step.description}</p> */}
                    </div>
                  </div>

                  {index < lifecycleSteps.length - 1 && (
                    <div className={`h-1 w-12 ${isComplete ? "bg-green-600" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
