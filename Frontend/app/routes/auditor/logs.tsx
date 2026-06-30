
export default function LogsPage() {
  const logs = [
    {
      action:
        "OTP Verification",
      user: "Student 1001",
      time:
        "2026-06-25 10:15",
    },
    {
      action:
        "Vote Cast",
      user: "Student 1002",
      time:
        "2026-06-25 10:18",
    },
  ];

  return (
      <div className="rounded-2xl bg-white shadow">
        <div className="border-b p-5">
          <h1 className="text-2xl font-bold">
            Audit Logs
          </h1>
        </div>

        <table className="w-full">
          <thead>
            <tr>
              <th className="p-4 text-left">
                Action
              </th>

              <th className="p-4 text-left">
                User
              </th>

              <th className="p-4 text-left">
                Time
              </th>
            </tr>
          </thead>

          <tbody>
            {logs.map((log, index) => (
              <tr
                key={index}
                className="border-t"
              >
                <td className="p-4">
                  {log.action}
                </td>

                <td className="p-4">
                  {log.user}
                </td>

                <td className="p-4">
                  {log.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}