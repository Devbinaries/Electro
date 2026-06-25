from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

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
    
class VotesViewSet(APIView):
    def get(self, request, pk=None):
        votes = Votes.objects.get(pk=pk)
        serializer = VotesSerializer(votes)
        return Response(serializer.data)
    
    
    def post(self, request):
        serializer = VotesSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
    
