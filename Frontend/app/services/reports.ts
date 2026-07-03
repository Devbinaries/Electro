import api from "./api";

export async function downloadAuditReport(
  electionId: string,
  format: "pdf" | "csv" | "xlsx"
) {
  const response = await api.get(
    `/api/elections/auditor/elections/${electionId}/audit-report/export/`,
    {
      params: { format },
      responseType: "blob",
    }
  );

  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    csv: "text/csv",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  const blob = new Blob([response.data], { type: mimeTypes[format] });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getDownloadFilename(response.headers["content-disposition"], `audit_report_${electionId}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function getDownloadFilename(contentDisposition: unknown, fallback: string) {
  if (typeof contentDisposition !== "string") return fallback;

  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return filenameMatch?.[1] ?? fallback;
}
