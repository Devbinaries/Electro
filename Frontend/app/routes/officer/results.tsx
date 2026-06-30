
export default function ResultsPage() {
  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Live Results
        </h1>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">
            President
          </h2>

          <div className="space-y-4">
            <div>
              <p>John Doe</p>

              <div className="mt-2 h-4 rounded-full bg-slate-200">
                <div className="h-4 w-[60%] rounded-full bg-blue-600" />
              </div>

              <p className="mt-1 text-sm">
                60%
              </p>
            </div>

            <div>
              <p>Jane Smith</p>

              <div className="mt-2 h-4 rounded-full bg-slate-200">
                <div className="h-4 w-[40%] rounded-full bg-green-600" />
              </div>

              <p className="mt-1 text-sm">
                40%
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}