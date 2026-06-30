from rest_framework import serializers
from rest_framework.reverse import reverse

from .models import Election, Position, Candidate, Vote

class ElectionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Election
        fields = "__all__"
        read_only_fields = (
            "election_id",
            "status",
            "is_locked",
            "created_at",
            "updated_at",
        )
        
class PositionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Position
        fields = "__all__"
        
class CandidateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Candidate
        fields = "__all__"
        
class VoteSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vote
        fields = "__all__"
        read_only_fields = (
            "created_at",
        )


class ElectionDashboardSerializer(serializers.ModelSerializer):
    voter_count = serializers.IntegerField(read_only=True)
    candidate_count = serializers.IntegerField(read_only=True)
    links = serializers.SerializerMethodField()

    class Meta:
        model = Election
        fields = (
            "election_id",
            "title",
            "status",
            "voter_count",
            "candidate_count",
            "links",
        )

    def get_links(self, obj):
        request = self.context.get("request")
        return {
            "detail": reverse("officer-election-detail", kwargs={"election_id": obj.election_id}, request=request),
            "results": reverse("officer-election-results", kwargs={"election_id": obj.election_id}, request=request),
        }


class ElectionDetailSerializer(serializers.ModelSerializer):
    electoral_officer = serializers.SerializerMethodField()
    candidates = serializers.SerializerMethodField()
    positions = serializers.SerializerMethodField()
    voter_stats = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()

    class Meta:
        model = Election
        fields = (
            "election_id",
            "title",
            "description",
            "status",
            "start_date",
            "end_date",
            "electoral_officer",
            "candidates",
            "positions",
            "voter_stats",
            "links",
        )

    def get_electoral_officer(self, obj):
        if not obj.electoral_officer:
            return None
        return {
            "id": obj.electoral_officer.id,
            "email": obj.electoral_officer.email,
            "username": obj.electoral_officer.username,
            "role": obj.electoral_officer.role,
        }

    def get_candidates(self, obj):
        return [
            {
                "id": candidate.id,
                "name": candidate.name,
                "position_id": candidate.position_id,
                "position_name": candidate.position.name if candidate.position else None,
            }
            for candidate in obj.candidates.all()
        ]

    def get_positions(self, obj):
        return [
            {
                "id": position.id,
                "name": position.name,
                "description": position.description,
                "max_winners": position.max_winners,
            }
            for position in obj.positions.all()
        ]

    def get_voter_stats(self, obj):
        total_voters = getattr(obj, "voter_count", obj.voter.count())
        verified_voters = getattr(obj, "verified_voter_count", obj.voter.filter(is_verified=True).count())
        voted_voters = getattr(obj, "voted_voter_count", obj.voter.filter(has_voted=True).count())
        return {
            "total_voters": total_voters,
            "verified_voters": verified_voters,
            "voted_voters": voted_voters,
        }

    def get_links(self, obj):
        request = self.context.get("request")
        return {
            "results": reverse("officer-election-results", kwargs={"election_id": obj.election_id}, request=request),
            "audit_logs": reverse("auditor-election-audit-logs", kwargs={"election_id": obj.election_id}, request=request),
            "fraud": reverse("auditor-election-fraud", kwargs={"election_id": obj.election_id}, request=request),
            "public_results": reverse("public-election-results", kwargs={"election_id": obj.election_id}, request=request),
        }


class ElectionResultsSerializer(serializers.Serializer):
    election = serializers.CharField()
    status = serializers.CharField()
    results = serializers.ListField()
        
