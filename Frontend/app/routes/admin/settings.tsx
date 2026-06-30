export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Election Settings</h1>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-800">Security & Access</h2>
        <p className="mt-2 text-sm text-slate-500">
          Configure voter eligibility rules, OTP expiry, and moderator permissions.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-800">Election Preferences</h2>
        <p className="mt-2 text-sm text-slate-500">
          Manage registration deadlines, public result visibility, and ballot appearance.
        </p>
      </div>
    </div>
  );
}
