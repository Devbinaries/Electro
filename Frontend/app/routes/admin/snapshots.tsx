export default function SnapshotsPage() {
  const snapshots = [
    { id: 1, title: "Election Snapshot - 06/20", createdAt: "2026-06-20" },
    { id: 2, title: "Election Snapshot - 06/22", createdAt: "2026-06-22" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Election Snapshots</h1>

      <div className="rounded-2xl bg-white shadow">
        <div className="border-b p-5">
          <h2 className="text-xl font-semibold text-slate-800">Saved snapshots</h2>
        </div>

        <div className="divide-y">
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="flex items-center justify-between p-5">
              <div>
                <h3 className="font-semibold text-slate-900">{snapshot.title}</h3>
                <p className="text-sm text-slate-500">Created on {snapshot.createdAt}</p>
              </div>
              <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
