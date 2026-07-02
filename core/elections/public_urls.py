from django.urls import path

from .api.public import (
    PublicActiveElectionView,
    PublicElectionBallotView,
    PublicElectionObserverView,
    PublicElectionResultsView,
    PublicElectionsView,
)


urlpatterns = [
    path("elections/active/", PublicActiveElectionView.as_view(), name="public-active-election"),
    path("elections/", PublicElectionsView.as_view(), name="public-elections"),
    path("elections/<uuid:election_id>/ballot/", PublicElectionBallotView.as_view(), name="public-election-ballot"),
    path("elections/<uuid:election_id>/", PublicElectionObserverView.as_view(), name="public-election-observer"),
    path("elections/<uuid:election_id>/results/", PublicElectionResultsView.as_view(), name="public-election-results"),
]
