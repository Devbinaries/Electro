from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from authentication.permissions import IsAdmin, IsElectoralOfficer, IsAssignedElectoralOfficer
from .models import Election, Candidate, Vote, Position, ElectionStatus
from .serializers import ElectionSerializer, CandidateSerializer, VoteSerializer, PositionSerializer
from .services import *
# from .permissions import *


def _check_election_mutation_permission(request, election):
    if not election:
        return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)
    if not (
        request.user.role == "ADMIN"
        or (
            request.user.role == "ELECTORAL_OFFICER"
            and election.electoral_officer_id == request.user.id
        )
    ):
        return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
    if not election.can_accept_changes():
        return Response(
            {"error": election.mutation_block_reason()},
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


# Create your views here.
class ElectionViewSet(viewsets.ModelViewSet):
    queryset = Election.objects.all()
    serializer_class = ElectionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        if request.user.role not in {"ADMIN", "ELECTORAL_OFFICER"}:
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        election = self.get_object()
        denied = _check_election_mutation_permission(request, election)
        if denied:
            return denied
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        election = self.get_object()
        denied = _check_election_mutation_permission(request, election)
        if denied:
            return denied
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        election = self.get_object()
        if request.user.role != "ADMIN" and not (
            request.user.role == "ELECTORAL_OFFICER"
            and election.electoral_officer_id == request.user.id
        ):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        if election.status != ElectionStatus.DRAFT:
            return Response(
                {"error": "Only draft elections can be deleted"},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    lookup_field = "name"
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        election_id = request.data.get("election") or request.data.get("election_id")
        election = Election.objects.filter(id=election_id).first() if election_id else None
        denied = _check_election_mutation_permission(request, election)
        if denied:
            return denied
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        denied = _check_election_mutation_permission(request, instance.election)
        if denied:
            return denied
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        denied = _check_election_mutation_permission(request, instance.election)
        if denied:
            return denied
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        denied = _check_election_mutation_permission(request, instance.election)
        if denied:
            return denied
        return super().destroy(request, *args, **kwargs)


class PositionViewSet(viewsets.ModelViewSet):
    queryset = Position.objects.all()
    serializer_class = PositionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        election_id = request.data.get("election") or request.data.get("election_id")
        election = Election.objects.filter(id=election_id).first() if election_id else None
        denied = _check_election_mutation_permission(request, election)
        if denied:
            return denied
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        denied = _check_election_mutation_permission(request, instance.election)
        if denied:
            return denied
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        denied = _check_election_mutation_permission(request, instance.election)
        if denied:
            return denied
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        denied = _check_election_mutation_permission(request, instance.election)
        if denied:
            return denied
        return super().destroy(request, *args, **kwargs)
    
class VotesView(APIView):
    def get(self, request, pk=None):
        votes = Vote.objects.get(pk=pk)
        serializer = VoteSerializer(votes)
        return Response(serializer.data)
    
    
    def post(self, request):
        session_token = request.data.get("session_token")
        election_id = request.data.get("election_id")
        votes = request.data.get("votes")

        try:
            result = cast_vote(
                session_token=session_token,
                election_id=election_id,
                votes=votes
            )

            return Response(
                {
                    "success": True,
                    "message": "Vote cast successfully",
                    "receipt_id": str(result["receipt"].receipt_number),
                    "submitted_at": result["receipt"].submitted_at,
                    "election": result["election"].title,
                },
                status=status.HTTP_201_CREATED
            )

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
class ElectionResultsView(APIView):
    # permission_classes = [IsAdmin | IsAuditor]
    def get(self, request, election_id):
        try:
            election = Election.objects.get(election_id=election_id)

            results = get_results(election)

            return Response(
                {
                    "election": election.title,
                    "results": list(results)
                },
                status=status.HTTP_200_OK
            )

        except Election.DoesNotExist:
            return Response(
                {"error": "Election not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
            
class ElectionTurnoutView(APIView):
    # permission_classes = [IsAdmin | IsElectoralOfficer]
    def get(self, request, election_id):
        try:
            election = Election.objects.get(election_id=election_id)

            turnout = get_turnout(election)

            return Response(
                {
                    "election": election.title,
                    "turnout_percentage": turnout
                },
                status=status.HTTP_200_OK
            )

        except Election.DoesNotExist:
            return Response(
                {"error": "Election not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
class ElectionAuditLogView(APIView):
    # permission_classes = [IsAuditor | IsAdmin]
    
    def get(self, request, election_id):
        logs = ElectionAuditLog.objects.filter(election__election_id=election_id).order_by("-timestamp")
        
        return Response([
            {"action":log.action,
            "voter" :str(log.voter),
            "metadata":log.metadata,
            "timestamp":log.timestamp}
            for log in logs
        ])
        

class LiveElectionResultsView(APIView):
    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        
        if not election:
            return Response(
                {"error":"Election not found"},
                status=404
            )
        
        results = get_live_results(election)
        
        return Response({
            "election":election.title,
            "status":election.status,
            "results":results,
            
        })