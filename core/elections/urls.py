from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import ElectionViewSet, CandidateViewSet, VotesView

router = DefaultRouter()
router.register(r'elections', ElectionViewSet, basename='election')
router.register(r'candidates', CandidateViewSet, basename='candidate')
router.register(r'votes', VotesView, basename='vote')

urlpatterns = [
    path('', include(router.urls)),
]