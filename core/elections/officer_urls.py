from django.urls import path

from .api.officer_dashboard import (
    OfficerDashboardSummaryView,
    OfficerElectionActivateView,
    OfficerElectionAnalyticsView,
    OfficerElectionCloseView,
    OfficerElectionDetailView,
    OfficerElectionLockView,
    OfficerElectionResultsView,
    OfficerElectionVotersView,
    OfficerVoterDetailView,
    OfficerVoterVerificationView,
    OfficerElectionReportView,
    OfficerElectionConfigurationView,
    OfficerElectionAuditLogsView,
    OfficerElectionFraudView,
)


urlpatterns = [
    path("officer/dashboard/summary/", OfficerDashboardSummaryView.as_view(), name="officer-dashboard-summary"),
    path("elections/<uuid:election_id>/", OfficerElectionDetailView.as_view(), name="officer-election-detail"),
    path("elections/<uuid:election_id>/results/", OfficerElectionResultsView.as_view(), name="officer-election-results"),
    path("elections/<uuid:election_id>/analytics/", OfficerElectionAnalyticsView.as_view(), name="officer-election-analytics"),
    path("elections/<uuid:election_id>/lock/", OfficerElectionLockView.as_view(), name="officer-election-lock"),
    path("elections/<uuid:election_id>/activate/", OfficerElectionActivateView.as_view(), name="officer-election-activate"),
    path("elections/<uuid:election_id>/close/", OfficerElectionCloseView.as_view(), name="officer-election-close"),
    # Voter Management
    path("elections/<uuid:election_id>/voters/", OfficerElectionVotersView.as_view(), name="officer-election-voters"),
    path("elections/<uuid:election_id>/voters/<int:voter_id>/", OfficerVoterDetailView.as_view(), name="officer-voter-detail"),
    path("elections/<uuid:election_id>/voters/<int:voter_id>/verify/", OfficerVoterVerificationView.as_view(), name="officer-voter-verify"),
    # Election Reports & Configuration
    path("elections/<uuid:election_id>/report/", OfficerElectionReportView.as_view(), name="officer-election-report"),
    path("elections/<uuid:election_id>/configuration/", OfficerElectionConfigurationView.as_view(), name="officer-election-config"),
    # Audit Logs
    path("elections/<uuid:election_id>/audit-logs/", OfficerElectionAuditLogsView.as_view(), name="officer-election-audit-logs"),
    path("elections/<uuid:election_id>/fraud/", OfficerElectionFraudView.as_view(), name="officer-election-fraud"),
]