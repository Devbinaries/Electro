from django.db import models

import uuid
# Create your models here.

class ElectionVoter(models.Model):
    voter_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    
    election = models.ForeignKey("elections.Election", on_delete=models.CASCADE, related_name='voter', null=True)
    student_id = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    department = models.CharField(max_length=50)
    is_verified = models.BooleanField(default=False)
    has_voted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["election", "student_id"],
                name="unique_voter_per_election" 
            )
        ]
        
    def __str__(self):
        return f"{self.student_id}-{self.election}"
    
    
class VoterVerification(models.Model):
    voter =models.ForeignKey( ElectionVoter, on_delete=models.CASCADE, related_name="verifications")
    verification_code =models.CharField(max_length=50)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.voter.student_id}"
    
    
class VotingSession(models.Model):
    voter = models.ForeignKey(
        ElectionVoter, on_delete=models.CASCADE, related_name="sessions"
    )
    session_token = models.UUIDField(
        default=uuid.uuid4, unique=True, editable=False
    )
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["voter"], condition=models.Q(is_active=True), name="one_Active_session_per_voter")
        ]
        
class VoteReceipt(models.Model):
    voter = models.OneToOneField( ElectionVoter, on_delete=models.CASCADE, related_name='receipt')
    receipt_number = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    submitted_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return str(self.receipt_number)