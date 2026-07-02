# from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone

# Create your views here.

from .models import ElectionVoter
from .serializers import *
from elections.models import Election, ElectionStatus
from .services import (
    create_verification,
    get_active_election_for_voter_verification,
    parse_voter_import_file,
    import_voters_from_rows,
)
from django.core.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny


class VerifyStudentIdView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        student_id = str(request.data.get("studentId", "")).strip()
        if not student_id:
            return Response({"valid": False, "error": "studentId is required"}, status=status.HTTP_400_BAD_REQUEST)

        election_id = request.data.get("electionId")
        if election_id:
            active_election = Election.objects.filter(election_id=election_id).first()
            if not active_election:
                return Response(
                    {"valid": False, "error": "Election is not active"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            active_election = Election.objects.order_by("-created_at").first()
            if not active_election:
                return Response({"valid": False, "error": "No active election"}, status=status.HTTP_404_NOT_FOUND)

        active_election.sync_status_from_schedule()
        if active_election.status != ElectionStatus.ACTIVE:
            return Response(
                {"valid": False, "error": "Election is not active"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        voter = ElectionVoter.objects.filter(election=active_election, student_id=student_id).first()
        if not voter:
            return Response({"valid": False}, status=status.HTTP_200_OK)

        return Response(
            {
                "valid": True,
                "studentId": voter.student_id,
                "voterId": str(voter.voter_id),
                "electionId": str(active_election.election_id),
                "electionTitle": active_election.title,
            },
            status=status.HTTP_200_OK,
        )


class PublicVerifyVoterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicVerifyVoterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student_id = serializer.validated_data["studentId"].strip()
        election_id = serializer.validated_data.get("electionId")

        if not student_id:
            return Response(
                {"success": False, "error": "Student ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            election = get_active_election_for_voter_verification(election_id)
        except ValueError as exc:
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        voter = ElectionVoter.objects.filter(
            election=election,
            student_id=student_id,
        ).first()
        if not voter:
            return Response(
                {"success": False, "error": "Invalid student ID or voter is not eligible."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if voter.has_voted:
            return Response(
                {"success": False, "error": "This voter has already voted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification, otp = create_verification(voter)
        except ValueError as exc:
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expires_in = max(int((verification.expires_at - timezone.now()).total_seconds()), 0)
        return Response(
            {
                "success": True,
                "verification_code": otp,
                "expires_in": expires_in,
                "voter_id": str(voter.voter_id),
                "election_id": str(election.election_id),
                "election_title": election.title,
            },
            status=status.HTTP_200_OK,
        )


class SendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, election_id, voter_id):
        try:
            election = get_active_election_for_voter_verification(election_id)
        except ValueError as exc:
            return Response({"success": False, "error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        voter = ElectionVoter.objects.select_related("election").filter(
            voter_id=voter_id,
            election=election,
        ).first()
        if not voter:
            return Response({"success": False, "error": "Voter not found."}, status=status.HTTP_404_NOT_FOUND)

        if voter.has_voted:
            return Response({"success": False, "error": "This voter has already voted."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            verification, otp = create_verification(voter)
        except ValueError as exc:
            return Response({"success": False, "error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        expires_in = max(int((verification.expires_at - timezone.now()).total_seconds()), 0)
        return Response({
            "success": True,
            "verification_code": otp,
            "expires_in": expires_in,
            "voter_id": str(voter.voter_id),
            "election_id": str(election.election_id),
            "election_title": election.title,
        }, status=status.HTTP_200_OK)


class ImportVotersView(APIView):
    """Endpoint to import voters CSV/XLSX for a given election.
    Allowed: Super Admin (admin UI) and assigned Electoral Officer via API.
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    def post(self, request, election_id):
        # permission check: SuperAdmin via admin UI is allowed, for API ensure assigned officer
        try:
            election = Election.objects.get(election_id=election_id)
        except Election.DoesNotExist:
            return Response({"error":"Election not found"}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if not (user.role == "ADMIN" or (user.role == "ELECTORAL_OFFICER" and election.electoral_officer_id == user.id)):
            return Response({"error":"Permission denied"}, status=status.HTTP_403_FORBIDDEN)

        if not election.can_accept_changes():
            return Response({"error": election.mutation_block_reason()}, status=status.HTTP_403_FORBIDDEN)

        uploaded = request.FILES.get("file")
        if not uploaded:
            return Response({"error":"file is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            rows = parse_voter_import_file(uploaded)
            created = import_voters_from_rows(election=election, rows=rows)
        except ValidationError as exc:
            detail = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            return Response({"error": detail}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error":"failed to import voters", "detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"imported": len(created)}, status=status.HTTP_201_CREATED)
        

class VerifyOTPNestedView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, election_id, voter_id):
        otp = request.data.get("otp", "").strip()
        
        if not otp:
            return Response(
                {"success": False, "error": "OTP is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            election = get_active_election_for_voter_verification(election_id)
        except ValueError as exc:
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        voter = ElectionVoter.objects.select_related("election").filter(
            voter_id=voter_id,
            election=election,
        ).first()
        if not voter:
            return Response(
                {"success": False, "error": "Voter not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if voter.has_voted:
            return Response(
                {"success": False, "error": "This voter has already voted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session = VerifyOTPSerializer(
                data={"otp": otp},
                context={"voter": voter},
            )
            session.is_valid(raise_exception=True)
            voting_session = session.save()
        except ValueError as exc:
            message = str(exc)
            status_code = status.HTTP_400_BAD_REQUEST
            if "expired" in message.lower():
                status_code = status.HTTP_400_BAD_REQUEST
            return Response(
                {"success": False, "error": message},
                status=status_code,
            )

        return Response(
            {
                "success": True,
                "is_verified": True,
                "session_token": str(voting_session.session_token),
                "expires_at": voting_session.expires_at,
            },
            status=status.HTTP_200_OK,
        )

        
class PublicVerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PublicVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        election_id = serializer.validated_data["electionId"]
        voter_id = serializer.validated_data["voterId"]
        otp = serializer.validated_data["otp"]

        try:
            election = get_active_election_for_voter_verification(election_id)
        except ValueError as exc:
            return Response(
                {"success": False, "error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        voter = ElectionVoter.objects.select_related("election").filter(
            voter_id=voter_id,
            election=election,
        ).first()
        if not voter:
            return Response(
                {"success": False, "error": "Voter not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if voter.has_voted:
            return Response(
                {"success": False, "error": "This voter has already voted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session = VerifyOTPSerializer(
                data={"otp": otp},
                context={"voter": voter},
            )
            session.is_valid(raise_exception=True)
            voting_session = session.save()
        except ValueError as exc:
            message = str(exc)
            status_code = status.HTTP_400_BAD_REQUEST
            if "expired" in message.lower():
                status_code = status.HTTP_400_BAD_REQUEST
            return Response(
                {"success": False, "error": message},
                status=status_code,
            )

        return Response(
            {
                "success": True,
                "session_token": str(voting_session.session_token),
                "expires_at": voting_session.expires_at,
            },
            status=status.HTTP_200_OK,
        )
        
class CreateVotingSessionView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request, election_id, voter_id):
        try:
            voter = ElectionVoter.objects.select_related("election").get(
                voter_id = voter_id,
                election__election_id=election_id
            )
        except ElectionVoter.DoesNotExist:
            return Response(
                {"error":"Voter not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        voter.election.sync_status_from_schedule()
        if voter.election.status != ElectionStatus.ACTIVE:
            return Response(
                {"error": "Voting is only allowed during active elections"},
                status=status.HTTP_403_FORBIDDEN,
            )
            
        serializer = CreateVotingSessionSerializer(
            data = {},
            context = {"voter": voter}
        )
        
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        
        return Response(
            {
                "message":"Voting session creates",
                "session_token":session.session_token,
                "expires_at":session.expires_at
            },
            status=status.HTTP_201_CREATED
        )
        
class ValidateSessionView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        
        serializer = ValidateSessionSerializer(
            data = request.data          
        )
        
        serializer.is_valid(raise_exception=True)
        
        session = serializer.validated_data["session"]
        
        return Response(
            {
                "message":"Session is valid",
                "voter":session.voter.id,
                "expires_at":session.expires_at
            },
            status=status.HTTP_200_OK
        )