from django.urls import path

from .api.public import PublicElectionResultsView, PublicElectionsView


urlpatterns = [
    path("elections/", PublicElectionsView.as_view(), name="public-elections"),
    path("elections/<uuid:election_id>/results/", PublicElectionResultsView.as_view(), name="public-election-results"),
]