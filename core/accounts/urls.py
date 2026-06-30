from django.urls import path

from .api.admin_dashboard import (
    AdminDashboardActivityView,
    AdminDashboardElectionsView,
    AdminDashboardSummaryView,
    AdminDashboardUsersView,
)


urlpatterns = [
    path("dashboard/summary/", AdminDashboardSummaryView.as_view(), name="admin-dashboard-summary"),
    path("dashboard/elections/", AdminDashboardElectionsView.as_view(), name="admin-dashboard-elections"),
    path("dashboard/users/", AdminDashboardUsersView.as_view(), name="admin-dashboard-users"),
    path("dashboard/activity/", AdminDashboardActivityView.as_view(), name="admin-dashboard-activity"),
]