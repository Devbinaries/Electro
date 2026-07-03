from rest_framework import serializers
from rest_framework.reverse import reverse

from authentication.models import User, Profile
from elections.models import Election, ElectionAuditLog


class AdminDashboardSummarySerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_elections = serializers.IntegerField()
    draft_elections = serializers.IntegerField()
    locked_elections = serializers.IntegerField()
    active_elections = serializers.IntegerField()
    closed_elections = serializers.IntegerField()
    total_electoral_officers = serializers.IntegerField()
    active_electoral_officers = serializers.IntegerField()
    total_auditors = serializers.IntegerField()
    total_registered_voters = serializers.IntegerField()
    total_votes_cast = serializers.IntegerField()
    overall_turnout_percentage = serializers.FloatField()


class AdminDashboardElectionSerializer(serializers.ModelSerializer):
    electoral_officer = serializers.SerializerMethodField()
    auditors = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()

    class Meta:
        model = Election
        fields = (
            "id",
            "election_id",
            "title",
            "status",
            "start_date",
            "end_date",
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


class AdminCreateUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = (
            "email",
            "username",
            "first_name",
            "last_name",
            "role",
            "password",
            "password_confirm",
        )

    def validate(self, data):
        if data["password"] != data.pop("password_confirm"):
            raise serializers.ValidationError({"password": "Passwords do not match"})
        
        if User.objects.filter(email=data["email"]).exists():
            raise serializers.ValidationError({"email": "Email already in use"})
        
        if User.objects.filter(username=data["username"]).exists():
            raise serializers.ValidationError({"username": "Username already in use"})
        
        return data

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
            role=validated_data.get("role", "ELECTORAL_OFFICER"),
        )
        return user


class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = (
            "full_name",
            "staff_id",
            "department",
            "is_verified",
        )


class AdminUserDetailSerializer(serializers.ModelSerializer):
    profile = AdminProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "profile",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")


class AdminUpdateUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "role",
            "is_active",
        )
