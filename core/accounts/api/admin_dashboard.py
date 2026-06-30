from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.permissions import IsSuperAdmin
from authentication.models import User, UserRole
from elections.models import Election, ElectionAuditLog

from ..serializers import AdminDashboardSummarySerializer, AdminDashboardElectionSerializer, AdminDashboardUserSerializer, AdminDashboardActivitySerializer


class AdminDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        data = {
            "total_users": User.objects.count(),
            "total_elections": Election.objects.count(),
            "active_elections": Election.objects.filter(status="ACTIVE").count(),
            "closed_elections": Election.objects.filter(status="CLOSED").count(),
            "total_electoral_officers": User.objects.filter(role=UserRole.ELECTORAL_OFFICER).count(),
            "total_auditors": User.objects.filter(role=UserRole.AUDITOR).count(),
        }
        return Response(AdminDashboardSummarySerializer(data).data, status=status.HTTP_200_OK)


class AdminDashboardElectionsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        elections = (
            Election.objects.select_related("electoral_officer")
            .prefetch_related("auditors")
            .order_by("-created_at")
        )
        serializer = AdminDashboardElectionSerializer(elections, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminDashboardUsersView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

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
    permission_classes = [IsAuthenticated, IsSuperAdmin]

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
