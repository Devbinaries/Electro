from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Election, Candidate, Votes
from .serializers import ElectionSerializer, CandidateSerializer, VotesSerializer

# Create your views here.
class ElectionViewSet(viewsets.ModelViewSet):
    queryset = Election.objects.all()
    serializer_class = ElectionSerializer

class CandidateViewSet(viewsets.ModelViewSet):
    queryset = Candidate.objects.all()
    serializer_class = CandidateSerializer
    lookup_field = "name"
    
class VotesView(APIView):
    def get(self, request, pk=None):
        votes = Votes.objects.get(pk=pk)
        serializer = VotesSerializer(votes)
        return Response(serializer.data)
    
    
    def post(self, request):
        session_token = request.data.get("session_token")
        election_id = request.data.get("election_id")
        position_id = request.data.get("position_id")
        candidate_id = request.data.get("candidate_id")

        try:
            vote = cast_vote(
                session_token=session_token,
                election_id=election_id,
                position_id=position_id,
                candidate_id=candidate_id
            )

            return Response(
                {
                    "message": "Vote cast successfully",
                    "vote_id": vote.id
                },
                status=status.HTTP_201_CREATED
            )

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
            
class ElectionResultsView(APIView):
    permission_classes = [IsAdmin | IsAuditor]
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
    permission_classes = [IsAdmin | IsElectoralOfficer]
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
    permission_classes = [IsAuditor | IsAdmin]
    
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