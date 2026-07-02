import api from "./api";

export async function downloadAuditReport(
  electionId: string,
  format: "pdf" | "csv" | "xlsx"
) {
  const response = await api.get(
    `/api/elections/elections/${electionId}/audit-report/export/`,
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
  link.download = `audit_report_${electionId}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
