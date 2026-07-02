from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.permissions import IsAdmin
from authentication.models import User, UserRole, Profile
from elections.models import Election, ElectionAuditLog

from elections.analytics import get_election_analytics, get_platform_summary

from ..serializers import (
    AdminDashboardSummarySerializer,
    AdminDashboardElectionSerializer,
    AdminDashboardUserSerializer,
    AdminDashboardActivitySerializer,
    AdminCreateUserSerializer,
    AdminUserDetailSerializer,
    AdminUpdateUserSerializer,
    AdminProfileSerializer,
)


class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        data = get_platform_summary()
        return Response(AdminDashboardSummarySerializer(data).data, status=status.HTTP_200_OK)


class AdminDashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        election_id = request.query_params.get("election_id")
        if not election_id:
            return Response(
                {"error": "election_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(get_election_analytics(election), status=status.HTTP_200_OK)


class AdminDashboardElectionsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        elections = (
            Election.objects.select_related("electoral_officer")
            .prefetch_related("auditors")
            .order_by("-created_at")
        )
        serializer = AdminDashboardElectionSerializer(elections, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminDashboardUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        role = request.query_params.get("role")
        queryset = User.objects.select_related("profile").order_by("-created_at")
        if role:
            queryset = queryset.filter(role=role)

        try:
            page_size = min(int(request.query_params.get("page_size", 20)), 100)
        except ValueError:
            page_size = 20

        try:
            page = max(int(request.query_params.get("page", 1)), 1)
        except ValueError:
            page = 1
        start = (page - 1) * page_size
        end = start + page_size

        total = queryset.count()
        users = queryset[start:end]
        serializer = AdminDashboardUserSerializer(users, many=True)
        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminDashboardActivityView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        audit_logs = ElectionAuditLog.objects.select_related("election", "voter").order_by("-timestamp")[:50]
        fraud_logs = (
            ElectionAuditLog.objects.select_related("election", "voter")
            .filter(action="FRAUD_ATTEMPT")
            .order_by("-timestamp")[:50]
        )
        audit_serializer = AdminDashboardActivitySerializer(audit_logs, many=True)
        fraud_serializer = AdminDashboardActivitySerializer(fraud_logs, many=True)
        return Response(
            {
                "audit_logs": audit_serializer.data,
                "fraud_logs": fraud_serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminUserCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = AdminCreateUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Create default profile
            Profile.objects.get_or_create(
                user=user,
                defaults={
                    "full_name": f"{user.first_name} {user.last_name}".strip(),
                },
            )
            return Response(AdminUserDetailSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, user_id):
        try:
            user = User.objects.select_related("profile").get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminUserDetailSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Prevent admin from modifying other admins
        if user.role == UserRole.ADMIN and user.id != request.user.id:
            return Response(
                {"error": "Cannot modify admin accounts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AdminUpdateUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(AdminUserDetailSerializer(user).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        # Prevent deleting admin accounts
        if user.role == UserRole.ADMIN:
            return Response(
                {"error": "Cannot delete admin accounts"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Prevent deleting the current user
        if user.id == request.user.id:
            return Response(
                {"error": "Cannot delete your own account"},
                status=status.HTTP_403_FORBIDDEN,
            )

        user_email = user.email
        user.delete()
        return Response(
            {"message": f"User {user_email} deleted successfully"},
            status=status.HTTP_204_NO_CONTENT,
        )


class AdminUserProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def put(self, request, user_id):
        try:
            user = User.objects.select_related("profile").get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            profile = user.profile
        except Profile.DoesNotExist:
            profile = Profile.objects.create(user=user)

        serializer = AdminProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(AdminUserDetailSerializer(user).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
