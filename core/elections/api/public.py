from django.db.models import Count
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.reverse import reverse

from elections.analytics import get_observer_analytics
from elections.models import Election, ElectionStatus, Vote
from elections.services import validate_voting_session


class PublicElectionObserverView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        election.sync_status_from_schedule()
        if election.status in {ElectionStatus.DRAFT, ElectionStatus.LOCKED}:
            return Response(
                {
                    "election_id": election.election_id,
                    "title": election.title,
                    "status": election.status,
                    "message": "This election is not yet open for public viewing.",
                    "results": [],
                },
                status=status.HTTP_200_OK,
            )

        results = (
            Vote.objects.filter(election=election)
            .values("position_id", "position__name", "candidate_id", "candidate__name")
            .annotate(total_votes=Count("id"))
            .order_by("position__name", "-total_votes")
        )

        return Response(
            {
                "election_id": election.election_id,
                "title": election.title,
                "status": election.status,
                "description": election.description,
                "results": list(results),
                "analytics": get_observer_analytics(election),
                "links": {
                    "self": reverse(
                        "public-election-observer",
                        kwargs={"election_id": election.election_id},
                        request=request,
                    ),
                },
            },
            status=status.HTTP_200_OK,
        )


class PublicElectionResultsView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        election.sync_status_from_schedule()
        if election.status != ElectionStatus.CLOSED:
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
        elections = list(
            Election.objects.filter(status__in=[ElectionStatus.ACTIVE, ElectionStatus.CLOSED])
            .order_by("-updated_at")
        )
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


class PublicActiveElectionView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        elections = Election.objects.order_by("-updated_at")
        election = None
        for candidate in elections:
            candidate.sync_status_from_schedule()
            if candidate.status == ElectionStatus.ACTIVE:
                election = candidate
                break

        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        positions = []
        for position in election.positions.all().prefetch_related("candidates"):
            positions.append(
                {
                    "id": str(position.id),
                    "position": position.name,
                    "candidates": [
                        {
                            "id": str(candidate.id),
                            "name": candidate.name,
                            "department": candidate.position.name if candidate.position else None,
                        }
                        for candidate in position.candidates.all()
                    ],
                }
            )

        return Response(
            {
                "election_id": election.election_id,
                "title": election.title,
                "status": election.status,
                "description": election.description,
                "positions": positions,
                "share_link": request.build_absolute_uri(f"/vote/{election.election_id}"),
            },
            status=status.HTTP_200_OK,
        )


class PublicElectionBallotView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election is not active"}, status=status.HTTP_404_NOT_FOUND)

        election.sync_status_from_schedule()
        if election.status != ElectionStatus.ACTIVE:
            return Response({"error": "Election is not active"}, status=status.HTTP_404_NOT_FOUND)

        session_token = request.query_params.get("session_token")
        if not session_token:
            return Response({"error": "A valid session token is required."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            validate_voting_session(session_token, election)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)

        positions = []
        for position in election.positions.all().prefetch_related("candidates"):
            positions.append(
                {
                    "id": str(position.id),
                    "position": position.name,
                    "candidates": [
                        {
                            "id": str(candidate.id),
                            "name": candidate.name,
                            "department": candidate.position.name if candidate.position else None,
                            "photo": request.build_absolute_uri(candidate.photo.url) if candidate.photo else None,
                        }
                        for candidate in position.candidates.all()
                    ],
                }
            )

        return Response(
            {
                "election_id": str(election.election_id),
                "title": election.title,
                "status": election.status,
                "positions": positions,
            },
            status=status.HTTP_200_OK,
        )
