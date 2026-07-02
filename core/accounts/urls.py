from django.urls import path

from .api.admin_dashboard import (
    AdminDashboardActivityView,
    AdminDashboardAnalyticsView,
    AdminDashboardElectionsView,
    AdminDashboardSummaryView,
    AdminDashboardUsersView,
    AdminUserCreateView,
    AdminUserDetailView,
    AdminUserProfileUpdateView,
)


urlpatterns = [
    path("dashboard/summary/", AdminDashboardSummaryView.as_view(), name="admin-dashboard-summary"),
    path("dashboard/analytics/", AdminDashboardAnalyticsView.as_view(), name="admin-dashboard-analytics"),
    path("dashboard/elections/", AdminDashboardElectionsView.as_view(), name="admin-dashboard-elections"),
    path("dashboard/users/", AdminDashboardUsersView.as_view(), name="admin-dashboard-users"),
    path("dashboard/activity/", AdminDashboardActivityView.as_view(), name="admin-dashboard-activity"),
    # User CRUD
    path("users/create/", AdminUserCreateView.as_view(), name="admin-users-create"),
    path("users/<int:user_id>/", AdminUserDetailView.as_view(), name="admin-users-detail"),
    path("users/<int:user_id>/profile/", AdminUserProfileUpdateView.as_view(), name="admin-users-profile"),
]