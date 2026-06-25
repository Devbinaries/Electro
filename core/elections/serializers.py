from rest_framework.serializers import HyperlinkedModelSerializer

from .models import Election, Candidate, Votes

class ElectionSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = Election
        fields = ["__all__"]

class CandidateSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = Candidate
        fields = ["__all__"]

class VotesSerializer(HyperlinkedModelSerializer):
    class Meta:
        model = Votes
        fields = ["__all__"]
