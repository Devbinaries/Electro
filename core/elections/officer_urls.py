from django.urls import path

from .api.officer_dashboard import (
    OfficerDashboardSummaryView,
    OfficerElectionDetailView,
    OfficerElectionResultsView,
)


urlpatterns = [
    path("dashboard/summary/", OfficerDashboardSummaryView.as_view(), name="officer-dashboard-summary"),
    path("elections/<uuid:election_id>/", OfficerElectionDetailView.as_view(), name="officer-election-detail"),
    path("elections/<uuid:election_id>/results/", OfficerElectionResultsView.as_view(), name="officer-election-results"),
]