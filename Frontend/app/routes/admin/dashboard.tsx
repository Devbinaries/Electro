import StatsCard from "~/components/dashboard/StatsCard";

export default function AdminDashboard() {
  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Admin Dashboard
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Voters"
            value="24,550"
          />

          <StatsCard
            title="Active Elections"
            value="4"
          />

          <StatsCard
            title="Election Officers"
            value="18"
          />

          <StatsCard
            title="Auditors"
            value="6"
          />
        </div>
      </div>
  );
}