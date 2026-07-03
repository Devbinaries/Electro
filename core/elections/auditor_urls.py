from django.urls import path

from .api.auditor_dashboard import (
    AuditorAuditReportExportView,
    AuditorDashboardAnalyticsView,
    AuditorDashboardSummaryView,
    AuditorElectionAuditLogsView,
    AuditorElectionFraudView,
)


urlpatterns = [
    path("auditor/dashboard/summary/", AuditorDashboardSummaryView.as_view(), name="auditor-dashboard-summary"),
    path("auditor/dashboard/analytics/", AuditorDashboardAnalyticsView.as_view(), name="auditor-dashboard-analytics"),
    path("auditor/elections/<uuid:election_id>/audit-report/export/", AuditorAuditReportExportView.as_view(), name="auditor-audit-report-export"),
    path("elections/<uuid:election_id>/audit-logs/", AuditorElectionAuditLogsView.as_view(), name="auditor-election-audit-logs"),
    path("elections/<uuid:election_id>/fraud/", AuditorElectionFraudView.as_view(), name="auditor-election-fraud"),
    path("elections/<uuid:election_id>/audit-report/export/", AuditorAuditReportExportView.as_view(), name="auditor-audit-report-export-legacy"),
]
