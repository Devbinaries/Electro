import { useState } from "react";

interface ReportItem {
  id: string;
  title: string;
  status: "Ready" | "Pending" | "Under Review";
  generatedAt: string;
}

const initialReports: ReportItem[] = [
  {
    id: "report-1",
    title: "Integrity Report",
    status: "Ready",
    generatedAt: "2026-06-25 15:40",
  },
  {
    id: "report-2",
    title: "Security Report",
    status: "Pending",
    generatedAt: "2026-06-26 10:05",
  },
];

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>(initialReports);

  const handleGenerate = () => {
    setReports((current) => [
      {
        id: `report-${current.length + 1}`,
        title: "Compliance Summary",
        status: "Under Review",
        generatedAt: new Date().toLocaleString(),
      },
      ...current,
    ]);
  };

  const downloadReport = (report: ReportItem) => {
    const content = `Report title: ${report.title}\nStatus: ${report.status}\nGenerated: ${report.generatedAt}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${report.title.replace(/\s+/g, "-")}.txt"`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Reports</h1>
          <p className="mt-2 text-sm text-slate-500">
            Generate, review, and download audit reports produced from election data.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Generate report
        </button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4">
          {reports.map((report) => (
            <div key={report.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{report.title}</h2>
                <p className="mt-1 text-sm text-slate-500">Status: {report.status}</p>
                <p className="mt-1 text-sm text-slate-400">Generated {report.generatedAt}</p>
              </div>
              <button
                type="button"
                onClick={() => downloadReport(report)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
