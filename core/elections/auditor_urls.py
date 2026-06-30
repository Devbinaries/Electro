from django.urls import path

from .api.auditor_dashboard import (
    AuditorDashboardSummaryView,
    AuditorElectionAuditLogsView,
    AuditorElectionFraudView,
)


urlpatterns = [
    path("dashboard/summary/", AuditorDashboardSummaryView.as_view(), name="auditor-dashboard-summary"),
    path("elections/<uuid:election_id>/audit-logs/", AuditorElectionAuditLogsView.as_view(), name="auditor-election-audit-logs"),
    path("elections/<uuid:election_id>/fraud/", AuditorElectionFraudView.as_view(), name="auditor-election-fraud"),
]