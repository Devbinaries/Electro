from django.db.models import Count, Prefetch, Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.permissions import IsAssignedElectoralOfficer, IsElectoralOfficer
from elections.models import Candidate, Election, Vote
from elections.serializers import ElectionDashboardSerializer, ElectionDetailSerializer


class OfficerDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer]

    def get(self, request):
        elections = (
            Election.objects.filter(electoral_officer_id=request.user.id)
            .select_related("electoral_officer")
            .annotate(
                voter_count=Count("voter", distinct=True),
                candidate_count=Count("candidates", distinct=True),
            )
            .order_by("-created_at")
        )

        statuses = elections.values("status").annotate(total=Count("id"))
        serializer = ElectionDashboardSerializer(elections, many=True, context={"request": request})
        return Response(
            {
                "assigned_elections": serializer.data,
                "status_breakdown": list(statuses),
            },
            status=status.HTTP_200_OK,
        )


class OfficerElectionDetailView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def get(self, request, election_id):
        election = (
            Election.objects.select_related("electoral_officer")
            .prefetch_related(
                Prefetch("candidates", queryset=Candidate.objects.select_related("position")),
                "positions",
            )
            .annotate(
                voter_count=Count("voter", distinct=True),
                verified_voter_count=Count("voter", filter=Q(voter__is_verified=True), distinct=True),
                voted_voter_count=Count("voter", filter=Q(voter__has_voted=True), distinct=True),
            )
            .filter(election_id=election_id)
            .first()
        )
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)
        serializer = ElectionDetailSerializer(election, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class OfficerElectionResultsView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)
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
            },
            status=status.HTTP_200_OK,
        )
