
export default function VotersPage() {
  const voters = [
    {
      id: "101",
      name: "John Doe",
      voted: true,
    },
    {
      id: "102",
      name: "Jane Smith",
      voted: false,
    },
  ];

  return (
      <div className="rounded-2xl bg-white shadow">
        <div className="border-b p-5">
          <h1 className="text-2xl font-bold">
            Registered Voters
          </h1>
        </div>

        <table className="w-full">
          <thead>
            <tr>
              <th className="p-4 text-left">
                ID
              </th>

              <th className="p-4 text-left">
                Name
              </th>

              <th className="p-4 text-left">
                Voted
              </th>
            </tr>
          </thead>

          <tbody>
            {voters.map((voter) => (
              <tr
                key={voter.id}
                className="border-t"
              >
                <td className="p-4">
                  {voter.id}
                </td>

                <td className="p-4">
                  {voter.name}
                </td>

                <td className="p-4">
                  {voter.voted
                    ? "Yes"
                    : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}