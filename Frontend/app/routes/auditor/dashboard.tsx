import StatsCard from "~/components/dashboard/StatsCard";

export default function AuditorDashboard() {
  return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">
          Auditor Dashboard
        </h1>

        <div className="grid gap-6 md:grid-cols-4">
          <StatsCard
            title="Audit Events"
            value="12,445"
          />

          <StatsCard
            title="Failed OTPs"
            value="45"
          />

          <StatsCard
            title="Security Alerts"
            value="3"
          />

          <StatsCard
            title="Reports"
            value="14"
          />
        </div>
      </div>
  );
}