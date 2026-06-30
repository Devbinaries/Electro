# from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

# Create your views here.

from .models import ElectionVoter
from .serializers import *
from elections.models import Election
from .services import parse_voter_import_file, import_voters_from_rows
from django.core.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser


class SendOTPView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, election_id, voter_id):
        
        try:
            voter = ElectionVoter.objects.get(
                id=voter_id,
                election__election_id = election_id
            )
        except ElectionVoter.DoesNotExist:
            return Response(
                {"error":"Voter not found"},
                status = status.HTTP_404_NOT_FOUND
            )
            
            
        serializer =SendOTPSerializer(
            data=request.data,
            context={"voter":voter}
        )
        
        serializer.is_valid(raise_exception=True)
        
        verification, otp = serializer.save()
        
        return Response(
            {"message" : "OTP sent successfully",
             "otp" : otp #remember not to include during production
             },
            status =status.HTTP_201_CREATED
        )


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
        if not (user.is_superuser or (user.role == "ELECTORAL_OFFICER" and election.electoral_officer_id == user.id)):
            return Response({"error":"Permission denied"}, status=status.HTTP_403_FORBIDDEN)

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
        
        
class VerifyOTPView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, election_id, voter_id):
        try:
            voter = ElectionVoter.objects.get(
                id=voter_id,
                election__election_id=election_id
            )
        except ElectionVoter.DoesNotExist:
            return Response(
                {
                    "error" : "Voter not found."
                },
                status=status.HTTP_404_NOT_FOUND
            )
            
        serializer = VerifyOTPSerializer(
            data=request.data,
            context={"voter":voter}
        )
        
        serializer.is_valid(raise_exception=True)
        voter = serializer.save()
        
        return Response(
            {
                "message" : "voter verified successfully",
                "is_verified" : voter.is_verified
            },
            status=status.HTTP_200_OK
        )
        
class CreateVotingSessionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, election_id, voter_id):
        try:
            voter = ElectionVoter.objects.get(
                id = voter_id,
                election__election_id=election_id
            )
        except ElectionVoter.DoesNotExist:
            return Response(
                {"error":"Voter not found"},
                status=status.HTTP_404_NOT_FOUND
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
    permission_classes = [IsAuthenticated]
    
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