import { useState } from "react";

interface AuditItem {
  id: string;
  title: string;
  status: "Pending" | "In Progress" | "Completed";
  findings: string;
  owner: string;
  createdAt: string;
}

const initialAudits: AuditItem[] = [
  {
    id: "audit-1",
    title: "Voter Registration Review",
    status: "Completed",
    findings:
      "A small number of duplicate entries were discovered in the voter roll; all duplicates were flagged for review.",
    owner: "Auditor Team Alpha",
    createdAt: "2026-06-25 09:45",
  },
  {
    id: "audit-2",
    title: "Ballot Integrity Check",
    status: "In Progress",
    findings:
      "The ballot configuration is being validated for all active elections and candidate mappings.",
    owner: "Auditor Team Beta",
    createdAt: "2026-06-26 11:20",
  },
];

export default function AuditsPage() {
  const [audits, setAudits] = useState<AuditItem[]>(initialAudits);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  const selectedAudit = audits.find((audit) => audit.id === selectedAuditId) ?? audits[0];

  const handleComplete = (id: string) => {
    setAudits((current) =>
      current.map((audit) =>
        audit.id === id
          ? { ...audit, status: "Completed" }
          : audit
      )
    );
  };

  const downloadAudit = (audit: AuditItem) => {
    const blob = new Blob([audit.findings], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${audit.title.replace(/\s+/g, "-")}.txt"`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Audit Tasks</h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage audits from the live election database and review findings.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setAudits((current) => [
                {
                  id: `audit-${current.length + 1}`,
                  title: "New System Audit",
                  status: "Pending",
                  findings:
                    "A new audit has been scheduled. Collecting election metadata and voter records.",
                  owner: "Auditor Team Gamma",
                  createdAt: new Date().toLocaleString(),
                },
                ...current,
              ])
            }
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Start audit
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            {audits.map((audit) => (
              <button
                key={audit.id}
                type="button"
                onClick={() => setSelectedAuditId(audit.id)}
                className={`w-full rounded-3xl border p-5 text-left transition ${
                  audit.id === selectedAudit?.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <h2 className="font-semibold text-slate-900">{audit.title}</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                    {audit.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{audit.owner}</p>
              </button>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedAudit?.title}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Status: {selectedAudit?.status}
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-slate-600">{selectedAudit?.findings}</p>
                <p className="text-sm text-slate-500">Created at: {selectedAudit?.createdAt}</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => selectedAudit && handleComplete(selectedAudit.id)}
                  className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Mark completed
                </button>
                <button
                  type="button"
                  onClick={() => selectedAudit && downloadAudit(selectedAudit)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Export findings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
