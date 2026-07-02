from django.db.models import Count, Prefetch, Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.permissions import IsAssignedElectoralOfficer, IsElectoralOfficer
from elections.analytics import get_officer_election_analytics
from elections.models import Candidate, Election, Vote, ElectionAuditLog
from elections.serializers import (
    ElectionDashboardSerializer,
    ElectionDetailSerializer,
    OfficerVoterSerializer,
    OfficerVoterUpdateSerializer,
    OfficerElectionReportSerializer,
    OfficerAuditLogSerializer,
    OfficerElectionConfigSerializer,
)
from voters.models import ElectionVoter


class OfficerDashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer]

    def get(self, request):
        elections = (
            Election.objects.filter(electoral_officer_id=request.user.id)
            .select_related("electoral_officer")
            .annotate(
                voter_count=Count("voter", distinct=True),
                candidate_count=Count("candidates", distinct=True),
            )
            .order_by("-created_at")
        )

        statuses = elections.values("status").annotate(total=Count("id"))
        serializer = ElectionDashboardSerializer(elections, many=True, context={"request": request})
        return Response(
            {
                "assigned_elections": serializer.data,
                "status_breakdown": list(statuses),
            },
            status=status.HTTP_200_OK,
        )


class OfficerElectionAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)
        return Response(get_officer_election_analytics(election), status=status.HTTP_200_OK)


class OfficerElectionDetailView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def get(self, request, election_id):
        election = (
            Election.objects.select_related("electoral_officer")
            .prefetch_related(
                Prefetch("candidates", queryset=Candidate.objects.select_related("position")),
                "positions",
            )
            .annotate(
                voter_count=Count("voter", distinct=True),
                verified_voter_count=Count("voter", filter=Q(voter__is_verified=True), distinct=True),
                voted_voter_count=Count("voter", filter=Q(voter__has_voted=True), distinct=True),
            )
            .filter(election_id=election_id)
            .first()
        )
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)
        serializer = ElectionDetailSerializer(election, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class OfficerElectionResultsView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)
        results = (
            Vote.objects.filter(election=election)
            .values("position_id", "position__name", "candidate_id", "candidate__name")
            .annotate(total_votes=Count("id"))
            .order_by("position__name", "-total_votes")
        )
        return Response(
            {
                "election": election.title,
                "status": election.status,
                "results": list(results),
            },
            status=status.HTTP_200_OK,
        )


class OfficerElectionLockView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def post(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)
        try:
            election.lock_election()
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"status": election.status}, status=status.HTTP_200_OK)


class OfficerElectionActivateView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def post(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)
        try:
            election.activate_election()
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"status": election.status}, status=status.HTTP_200_OK)


class OfficerElectionCloseView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def post(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)
        try:
            election.close_election()
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"status": election.status}, status=status.HTTP_200_OK)


# Voter Management Views
class OfficerElectionVotersView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        # Search and filter
        queryset = ElectionVoter.objects.filter(election=election)
        
        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(student_id__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )

        # Filter by verification status
        verified = request.query_params.get("verified")
        if verified is not None:
            queryset = queryset.filter(is_verified=verified.lower() == "true")

        # Filter by voted status
        voted = request.query_params.get("voted")
        if voted is not None:
            queryset = queryset.filter(has_voted=voted.lower() == "true")

        # Pagination
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
        voters = queryset.order_by("-created_at")[start:end]
        serializer = OfficerVoterSerializer(voters, many=True)

        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class OfficerVoterDetailView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def get(self, request, election_id, voter_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        try:
            voter = ElectionVoter.objects.get(id=voter_id, election=election)
        except ElectionVoter.DoesNotExist:
            return Response({"error": "Voter not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = OfficerVoterSerializer(voter)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, election_id, voter_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        if not election.can_accept_changes():
            return Response({"error": election.mutation_block_reason()}, status=status.HTTP_403_FORBIDDEN)

        try:
            voter = ElectionVoter.objects.get(id=voter_id, election=election)
        except ElectionVoter.DoesNotExist:
            return Response({"error": "Voter not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = OfficerVoterUpdateSerializer(voter, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(OfficerVoterSerializer(voter).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OfficerVoterVerificationView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def put(self, request, election_id, voter_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        if not election.can_accept_changes():
            return Response({"error": election.mutation_block_reason()}, status=status.HTTP_403_FORBIDDEN)

        try:
            voter = ElectionVoter.objects.get(id=voter_id, election=election)
        except ElectionVoter.DoesNotExist:
            return Response({"error": "Voter not found"}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action", "verify").lower()

        if action == "verify":
            voter.is_verified = True
        elif action == "unverify":
            voter.is_verified = False
        else:
            return Response(
                {"error": "Invalid action. Use 'verify' or 'unverify'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        voter.save()
        return Response(OfficerVoterSerializer(voter).data, status=status.HTTP_200_OK)


class OfficerElectionReportView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        voters = ElectionVoter.objects.filter(election=election)
        total_voters = voters.count()
        verified_voters = voters.filter(is_verified=True).count()
        voted_voters = voters.filter(has_voted=True).count()
        unverified_voters = total_voters - verified_voters

        turnout_percentage = (voted_voters / total_voters * 100) if total_voters > 0 else 0

        fraud_attempts = ElectionAuditLog.objects.filter(
            election=election, action="FRAUD_ATTEMPT"
        ).count()

        data = {
            "total_voters": total_voters,
            "verified_voters": verified_voters,
            "voted_voters": voted_voters,
            "unverified_voters": unverified_voters,
            "turnout_percentage": round(turnout_percentage, 2),
            "fraud_attempts": fraud_attempts,
        }

        serializer = OfficerElectionReportSerializer(data)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OfficerElectionConfigurationView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)
        serializer = ElectionDetailSerializer(election, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        serializer = OfficerElectionConfigSerializer(election, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                ElectionDetailSerializer(election, context={"request": request}).data,
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OfficerElectionAuditLogsView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        queryset = ElectionAuditLog.objects.filter(election=election).select_related(
            "election", "voter"
        ).order_by("-timestamp")

        action = request.query_params.get("action")
        if action:
            queryset = queryset.filter(action=action)

        # Pagination
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
        serializer = OfficerAuditLogSerializer(logs, many=True)

        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class OfficerElectionFraudView(APIView):
    permission_classes = [IsAuthenticated, IsElectoralOfficer, IsAssignedElectoralOfficer]

    def get(self, request, election_id):
        election = Election.objects.filter(election_id=election_id).first()
        if not election:
            return Response({"error": "Election not found"}, status=status.HTTP_404_NOT_FOUND)

        self.check_object_permissions(request, election)

        queryset = ElectionAuditLog.objects.filter(
            election=election, action="FRAUD_ATTEMPT"
        ).select_related("election", "voter").order_by("-timestamp")

        # Pagination
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
        frauds = queryset[start:end]
        serializer = OfficerAuditLogSerializer(frauds, many=True)

        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
