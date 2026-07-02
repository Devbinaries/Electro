export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Election Settings</h1>
      <p className="text-sm text-slate-500">
        No settings API is exposed by the backend. System configuration is managed through Django admin.
      </p>
    </div>
  );
}
