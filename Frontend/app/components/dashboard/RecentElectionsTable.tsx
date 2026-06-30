import ElectionStatusBadge from "./ElectionStatusBadge";

export default function RecentElectionsTable() {
  const elections = [
    {
      name: "SRC Election 2027",
      voters: 2500,
      status: "active",
    },
    {
      name: "Department Election",
      voters: 1400,
      status: "completed",
    },
  ];

  return (
    <div className="rounded-2xl bg-white shadow">
      <div className="border-b p-5">
        <h2 className="font-semibold">
          Recent Elections
        </h2>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-slate-500">
            <th className="p-4">
              Election
            </th>

            <th className="p-4">
              Voters
            </th>

            <th className="p-4">
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {elections.map((election) => (
            <tr
              key={election.name}
              className="border-t"
            >
              <td className="p-4">
                {election.name}
              </td>

              <td className="p-4">
                {election.voters}
              </td>

              <td className="p-4">
                <ElectionStatusBadge
                  status={
                    election.status as any
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}