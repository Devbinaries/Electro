from rest_framework import serializers
from rest_framework.reverse import reverse

from .models import Election, Position, Candidate, Vote, ElectionAuditLog
from voters.models import ElectionVoter

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

    def validate(self, data):
        start_date = data.get("start_date") or (self.instance.start_date if self.instance else None)
        end_date = data.get("end_date") or (self.instance.end_date if self.instance else None)
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("Start date must be before end date")
        return data
        
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
            "id",
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
                "photo": candidate.photo.url if candidate.photo else None,
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
        election_id = str(obj.election_id)
        return {
            "results": reverse("officer-election-results", kwargs={"election_id": obj.election_id}, request=request),
            "audit_logs": reverse("auditor-election-audit-logs", kwargs={"election_id": obj.election_id}, request=request),
            "fraud": reverse("auditor-election-fraud", kwargs={"election_id": obj.election_id}, request=request),
            "public_results": reverse("public-election-results", kwargs={"election_id": obj.election_id}, request=request),
            "voter_portal": f"/vote/{election_id}",
            "observer_portal": f"/observer?election={election_id}",
        }


class ElectionResultsSerializer(serializers.Serializer):
    election = serializers.CharField()
    status = serializers.CharField()
    results = serializers.ListField()


class AdminCreateElectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Election
        fields = (
            "title",
            "description",
            "start_date",
            "end_date",
        )

    def validate(self, data):
        start_date = data.get("start_date") or (self.instance.start_date if self.instance else None)
        end_date = data.get("end_date") or (self.instance.end_date if self.instance else None)
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("Start date must be before end date")
        return data

    def create(self, validated_data):
        election = Election.objects.create(**validated_data)
        return election


class AdminUpdateElectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Election
        fields = (
            "title",
            "description",
            "start_date",
            "end_date",
        )

    def validate(self, data):
        start_date = data.get("start_date") or (self.instance.start_date if self.instance else None)
        end_date = data.get("end_date") or (self.instance.end_date if self.instance else None)
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("Start date must be before end date")
        return data


class AdminElectionDetailSerializer(serializers.ModelSerializer):
    electoral_officer = serializers.SerializerMethodField()
    auditors = serializers.SerializerMethodField()
    positions_count = serializers.SerializerMethodField()
    candidates_count = serializers.SerializerMethodField()

    class Meta:
        model = Election
        fields = (
            "id",
            "election_id",
            "title",
            "description",
            "status",
            "start_date",
            "end_date",
            "is_locked",
            "electoral_officer",
            "auditors",
            "positions_count",
            "candidates_count",
            "created_at",
            "updated_at",
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

    def get_auditors(self, obj):
        return [
            {
                "id": auditor.id,
                "email": auditor.email,
                "username": auditor.username,
                "role": auditor.role,
            }
            for auditor in obj.auditors.all()
        ]

    def get_positions_count(self, obj):
        return obj.positions.count()

    def get_candidates_count(self, obj):
        return obj.candidates.count()


# Officer Voter Serializers
class OfficerVoterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElectionVoter
        fields = (
            "id",
            "voter_id",
            "student_id",
            "first_name",
            "last_name",
            "email",
            "department",
            "is_verified",
            "has_voted",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "voter_id",
            "created_at",
            "updated_at",
            "has_voted",
        )


class OfficerVoterUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElectionVoter
        fields = (
            "is_verified",
        )


class OfficerElectionReportSerializer(serializers.Serializer):
    total_voters = serializers.IntegerField()
    verified_voters = serializers.IntegerField()
    voted_voters = serializers.IntegerField()
    unverified_voters = serializers.IntegerField()
    turnout_percentage = serializers.FloatField()
    fraud_attempts = serializers.IntegerField()


class OfficerAuditLogSerializer(serializers.ModelSerializer):
    election_title = serializers.CharField(source="election.title", read_only=True)
    voter_info = serializers.SerializerMethodField()

    class Meta:
        model = ElectionAuditLog
        fields = (
            "id",
            "election_title",
            "voter_info",
            "action",
            "metadata",
            "timestamp",
        )

    def get_voter_info(self, obj):
        if not obj.voter:
            return None
        return {
            "student_id": obj.voter.student_id,
            "name": f"{obj.voter.first_name} {obj.voter.last_name}",
        }


class OfficerElectionConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Election
        fields = (
            "title",
            "description",
            "start_date",
            "end_date",
        )

    def validate(self, data):
        start_date = data.get("start_date") or (self.instance.start_date if self.instance else None)
        end_date = data.get("end_date") or (self.instance.end_date if self.instance else None)
        if start_date and end_date and start_date >= end_date:
            raise serializers.ValidationError("Start date must be before end date")
        return data

    def update(self, instance, validated_data):
        # Only allow editing if election is in DRAFT status
        if instance.status != "DRAFT":
            raise serializers.ValidationError(
                "Can only edit elections in DRAFT status"
            )
        
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.start_date = validated_data.get("start_date", instance.start_date)
        instance.end_date = validated_data.get("end_date", instance.end_date)
        instance.save()
        return instance
        
