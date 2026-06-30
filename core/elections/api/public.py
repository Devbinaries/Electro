from django.db.models import Count
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.reverse import reverse

from elections.models import Election, Vote


class PublicElectionResultsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id, status="CLOSED").first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        results = (
            Vote.objects.filter(election=election)
            .values("position_id", "position__name", "candidate_id", "candidate__name")
            .annotate(total_votes=Count("id"))
            .order_by("position__name", "-total_votes")
        )
        return Response(
            {
                "election": election.title,
                "status": election.status,
                "results": list(results),
                "links": {
                    "self": reverse("public-election-results", kwargs={"election_id": election.election_id}, request=request),
                },
            },
            status=status.HTTP_200_OK,
        )


class PublicElectionsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        elections = list(Election.objects.filter(status="CLOSED").order_by("-updated_at"))
        election_ids = [election.id for election in elections]
        result_rows = (
            Vote.objects.filter(election_id__in=election_ids)
            .values("election_id", "position_id", "position__name", "candidate_id", "candidate__name")
            .annotate(total_votes=Count("id"))
            .order_by("election_id", "position__name", "-total_votes")
        )

        results_by_election = {}
        for row in result_rows:
            results_by_election.setdefault(row["election_id"], []).append(row)

        data = []
        for election in elections:
            data.append(
                {
                    "election_id": election.election_id,
                    "title": election.title,
                    "status": election.status,
                    "final_results": results_by_election.get(election.id, []),
                    "links": {
                        "results": reverse("public-election-results", kwargs={"election_id": election.election_id}, request=request),
                    },
                }
            )
        return Response({"results": data}, status=status.HTTP_200_OK)
