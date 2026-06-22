from rest_framework import serializers

from .models import ElectionVoter
from . services import *

class ElectionVoterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ElectionVoter
        fields = '__all__'
        

class SendOTPSerializers(serializers.Serializer):
    voter_id = serializers.UUIDField()
    
    def validate(self, data):
        return data
    
    def save(self):
        voter = self.context["voter"]
        return create_verification(voter)
    
    
class VerifyOTPSerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=10)
    
    def save(self):
        voter = self.context["voter"]
        otp = self.validate_data["otp"]
        
        return verify_otp(voter. otp)
    

class CreateVotingSessionSerializer(serializers.Serializer):
    def save(self):
        voter = self.context["voter"]
        return create_voting_session(voter)
    
class ValidateSessionSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    
    def validate(self, data):
        token = data["token"]
        
        session = validate_session(token)
        
        data["session"] = session
        return data
    
    
