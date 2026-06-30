from django.db.models import Count
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.reverse import reverse

from authentication.permissions import IsAssignedAuditor, IsAuditor
from elections.models import Election, ElectionAuditLog


class AuditorDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsAuditor]

    def get(self, request):
        elections = (
            Election.objects.filter(auditors=request.user)
            .annotate(
                voter_count=Count("voter", distinct=True),
                vote_count=Count("votes", distinct=True),
            )
            .order_by("-created_at")
        )
        audit_logs = ElectionAuditLog.objects.filter(election__auditors=request.user)
        fraud_attempts = audit_logs.filter(action="FRAUD_ATTEMPT").count()
        turnout = []
        assigned = []
        for election in elections:
            turnout.append(
                {
                    "election_id": election.election_id,
                    "title": election.title,
                    "turnout_percentage": 0 if election.voter_count == 0 else (election.vote_count / election.voter_count) * 100,
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

        return Response(
            {
                "assigned_elections": assigned,
                "total_audit_logs": audit_logs.count(),
                "fraud_attempts": fraud_attempts,
                "voter_turnout": turnout,
            },
            status=status.HTTP_200_OK,
        )


class AuditorElectionAuditLogsView(APIView):
    permission_classes = [IsAuthenticated, IsAuditor, IsAssignedAuditor]

    def get(self, request, election_id):
        action = request.query_params.get("action")
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        queryset = (
            ElectionAuditLog.objects.select_related("election", "voter")
            .filter(election=election)
            .order_by("-timestamp")
        )
        if action:
            queryset = queryset.filter(action=action)

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
            for log in queryset
        ]
        return Response({"results": data}, status=status.HTTP_200_OK)


class AuditorElectionFraudView(APIView):
    permission_classes = [IsAuthenticated, IsAuditor, IsAssignedAuditor]

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        logs = (
            ElectionAuditLog.objects.select_related("election", "voter")
            .filter(election=election, action="FRAUD_ATTEMPT")
            .order_by("-timestamp")
        )
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

        return Response({"results": results}, status=status.HTTP_200_OK)
