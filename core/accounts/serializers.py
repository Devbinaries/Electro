from rest_framework import serializers
from rest_framework.reverse import reverse

from authentication.models import User
from elections.models import Election, ElectionAuditLog


class AdminDashboardSummarySerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_elections = serializers.IntegerField()
    active_elections = serializers.IntegerField()
    closed_elections = serializers.IntegerField()
    total_electoral_officers = serializers.IntegerField()
    total_auditors = serializers.IntegerField()


class AdminDashboardElectionSerializer(serializers.ModelSerializer):
    electoral_officer = serializers.SerializerMethodField()
    auditors = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()

    class Meta:
        model = Election
        fields = (
            "election_id",
            "title",
            "status",
            "electoral_officer",
            "auditors",
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

    def get_links(self, obj):
        request = self.context.get("request")
        public_results = None
        if obj.status == "CLOSED":
            public_results = reverse("public-election-results", kwargs={"election_id": obj.election_id}, request=request)
        return {
            "public_results": public_results,
        }


class AdminDashboardUserSerializer(serializers.ModelSerializer):
    profile_full_name = serializers.SerializerMethodField()
    profile_department = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "role",
            "first_name",
            "last_name",
            "profile_full_name",
            "profile_department",
            "created_at",
        )

    def get_profile_full_name(self, obj):
        profile = getattr(obj, "profile", None)
        return None if not profile else profile.full_name

    def get_profile_department(self, obj):
        profile = getattr(obj, "profile", None)
        return None if not profile else profile.department


class AdminDashboardActivitySerializer(serializers.ModelSerializer):
    election_title = serializers.CharField(source="election.title", read_only=True)
    voter_student_id = serializers.SerializerMethodField()

    class Meta:
        model = ElectionAuditLog
        fields = (
            "id",
            "election_title",
            "voter_student_id",
            "action",
            "metadata",
            "timestamp",
        )

    def get_voter_student_id(self, obj):
        return None if not obj.voter else obj.voter.student_id
