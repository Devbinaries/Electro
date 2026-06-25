# from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

# Create your views here.

from .models import ElectionVoter
from .serializers import *


class SendOTPView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, election_id, voter_id):
        
        try:
            voter = ElectionVoter.objects.get(
                id=voter_id,
                election_id = election_id
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
        
        
class VerifyOTPView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, election_id, voter_id):
        try:
            voter = ElectionVoter.object.get(
                id=voter_id,
                election_id=election_id
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
                election_id=election_id
            )
        except ElectionVoter.DoesNotExist:
            return Response(
                {"error":"Voter not found"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        serializer = CreateVotingSessionSerializer(
            data = {},
            contet = {"voter": voter}
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
        
        session = serializer.validates_data["session"]
        
        return Response(
            {
                "message":"Session is valid",
                "voter":session.voter.id,
                "expires_at":session.expires_at
            },
            status=status.HTTP_200_OK
        )