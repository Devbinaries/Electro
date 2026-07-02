from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ElectionViewSet, CandidateViewSet, PositionViewSet, VotesView
from .api.admin import (
    AdminElectionCreateView,
    AdminElectionDetailView,
    AdminElectionStatusView,
    AdminElectionListView,
)

router = DefaultRouter()
router.register(r'elections', ElectionViewSet, basename='election')
router.register(r'candidates', CandidateViewSet, basename='candidate')
router.register(r'positions', PositionViewSet, basename='position')

urlpatterns = [
    path('votes/', VotesView.as_view(), name='vote'),
    # Admin election endpoints
    path('admin/elections/', AdminElectionListView.as_view(), name='admin-elections-list'),
    path('admin/elections/create/', AdminElectionCreateView.as_view(), name='admin-elections-create'),
    path('admin/elections/<int:election_id>/', AdminElectionDetailView.as_view(), name='admin-elections-detail'),
    path('admin/elections/<int:election_id>/status/', AdminElectionStatusView.as_view(), name='admin-elections-status'),
    path('', include(router.urls)),
]