from django.db.models import Count, Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.reverse import reverse

from authentication.permissions import IsAssignedAuditor, IsAuditor
from elections.analytics import get_auditor_analytics
from elections.models import Election, ElectionAuditLog
from elections.report_exports import (
    export_audit_report_csv,
    export_audit_report_pdf,
    export_audit_report_xlsx,
)


class AuditorDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsAuditor]

    def get(self, request):
        elections = (
            Election.objects.filter(auditors=request.user)
            .annotate(
                voter_count=Count("voter", distinct=True),
                voted_count=Count("voter", filter=Q(voter__has_voted=True), distinct=True),
            )
            .order_by("-created_at")
        )
        audit_logs = ElectionAuditLog.objects.filter(election__auditors=request.user)
        fraud_attempts = audit_logs.filter(action="FRAUD_ATTEMPT").count()
        turnout = []
        assigned = []
        for election in elections:
            turnout_pct = 0 if election.voter_count == 0 else round(
                (election.voted_count / election.voter_count) * 100, 2
            )
            turnout.append(
                {
                    "election_id": election.election_id,
                    "title": election.title,
                    "turnout_percentage": turnout_pct,
                }
            )
            assigned.append(
                {
                    "election_id": election.election_id,
                    "title": election.title,
                    "status": election.status,
                    "links": {
                        "audit_logs": reverse("auditor-election-audit-logs", kwargs={"election_id": election.election_id}, request=request),
                        "fraud": reverse("auditor-election-fraud", kwargs={"election_id": election.election_id}, request=request),
                    },
                }
            )

        analytics = get_auditor_analytics(user=request.user)

        return Response(
            {
                "assigned_elections": assigned,
                "total_audit_logs": audit_logs.count(),
                "fraud_attempts": fraud_attempts,
                "voter_turnout": turnout,
                "verification_events": analytics["verification_events"],
                "otp_requests": analytics["otp_requests"],
                "votes_recorded": analytics["votes_recorded"],
                "failed_verification_attempts": analytics["failed_verification_attempts"],
                "suspicious_events": analytics["suspicious_events"],
            },
            status=status.HTTP_200_OK,
        )


class AuditorDashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsAuditor]

    def get(self, request):
        election_id = request.query_params.get("election_id")
        election = None
        if election_id:
            election = Election.objects.filter(
                election_id=election_id, auditors=request.user
            ).first()
            if not election:
                return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(get_auditor_analytics(user=request.user, election=election), status=status.HTTP_200_OK)


class AuditorElectionAuditLogsView(APIView):
    permission_classes = [IsAuthenticated, IsAuditor, IsAssignedAuditor]

    def get(self, request, election_id):
        action = request.query_params.get("action")
        search = request.query_params.get("search", "").strip()
        sort = request.query_params.get("sort", "-timestamp")

        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        queryset = (
            ElectionAuditLog.objects.select_related("election", "voter")
            .filter(election=election)
        )
        if action:
            queryset = queryset.filter(action=action)

        if search:
            queryset = queryset.filter(
                Q(action__icontains=search)
                | Q(voter__student_id__icontains=search)
                | Q(voter__email__icontains=search)
            )

        allowed_sorts = {"timestamp", "-timestamp", "action", "-action"}
        if sort not in allowed_sorts:
            sort = "-timestamp"
        queryset = queryset.order_by(sort)

        try:
            page_size = min(int(request.query_params.get("page_size", 50)), 200)
        except ValueError:
            page_size = 50

        try:
            page = max(int(request.query_params.get("page", 1)), 1)
        except ValueError:
            page = 1

        start = (page - 1) * page_size
        end = start + page_size
        total = queryset.count()
        logs = queryset[start:end]

        data = [
            {
                "id": log.id,
                "action": log.action,
                "voter": None if not log.voter else {
                    "id": log.voter.id,
                    "student_id": log.voter.student_id,
                    "email": log.voter.email,
                },
                "metadata": log.metadata,
                "timestamp": log.timestamp,
            }
            for log in logs
        ]
        return Response(
            {"count": total, "page": page, "page_size": page_size, "results": data},
            status=status.HTTP_200_OK,
        )


class AuditorElectionFraudView(APIView):
    permission_classes = [IsAuthenticated, IsAuditor, IsAssignedAuditor]

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        queryset = (
            ElectionAuditLog.objects.select_related("election", "voter")
            .filter(election=election, action="FRAUD_ATTEMPT")
            .order_by("-timestamp")
        )

        try:
            page_size = min(int(request.query_params.get("page_size", 50)), 200)
        except ValueError:
            page_size = 50

        try:
            page = max(int(request.query_params.get("page", 1)), 1)
        except ValueError:
            page = 1

        start = (page - 1) * page_size
        end = start + page_size
        total = queryset.count()
        logs = queryset[start:end]

        results = []
        for log in logs:
            results.append(
                {
                    "id": log.id,
                    "action": log.action,
                    "metadata": log.metadata,
                    "metadata_explanation": log.metadata.get("type") if log.metadata else None,
                    "voter": None if not log.voter else {
                        "id": log.voter.id,
                        "student_id": log.voter.student_id,
                        "email": log.voter.email,
                    },
                    "timestamp": log.timestamp,
                }
            )

        return Response(
            {"count": total, "page": page, "page_size": page_size, "results": results},
            status=status.HTTP_200_OK,
        )


class AuditorAuditReportExportView(APIView):
    permission_classes = [IsAuthenticated, IsAuditor, IsAssignedAuditor]

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        export_format = request.query_params.get("format", "csv").lower()
        if export_format == "pdf":
            return export_audit_report_pdf(election)
        if export_format == "xlsx":
            return export_audit_report_xlsx(election)
        if export_format == "csv":
            return export_audit_report_csv(election)

        return Response(
            {"error": "Invalid format. Use pdf, csv, or xlsx."},
            status=status.HTTP_400_BAD_REQUEST,
        )
