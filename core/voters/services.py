import secrets
from datetime import timedelta

from django.utils import timezone
from .models import *

def generate_otp(length=6):
    """Generate a numeric otp"""
    
    return "".join(
        str(secrets.randbelow(10))
        for _ in range (length)
    )

    
def create_verification(voter):
    
    
    if voter.has_voted:
        raise ValueError(
        "This voter has already voted."
    )
        
    existing_verification = (
        VoterVerification.objects.filter(
            voter = voter,
            is_used=False,
            expires_at__gt=timezone.now()
        )
        .order_by("created_at")
        .first()
    )
    
    if existing_verification:
        raise ValueError(
            "An active verification cose already exists"
        )
        
    otp = generate_otp()
    
    verification = VoterVerification.objects.create(
        voter = voter, 
        verification_code= otp,
        expires_at = timezone.now() + timedelta(minutes=5)
        
    )
    
    
    return verification, otp



def verify_otp(voter,otp):
    """Verify Otp"""
    
    verification =(
        VoterVerification.objects.filter(
            voter = voter,
            verification_code_hash = otp,
            is_used =False
        )
        .order_by("created_at")
        .first()
    )
    
    if not verification:
        raise ValueError("Invalid verification code")
    
    
    if verification.expires_at < timezone.now():
        raise ValueError(
            "verification code expired."
        )
        
    verification.is_used = True
    verification.save(update_fields=["is_used"])
    
    voter.is_verified = True
    voter.save(update_fields=["is_used"])
    
    return voter


def create_voting_session(voter):
    """
    Create a voting session after verification.
    """
    
    if voter.has_voted:
        raise ValueError(
            "Vote already cast."
    )
    
    if not voter.is_voted:
        raise ValueError(
            "verification required"
        )   
        
    existing_session = (
        VottingSession.objects.filter(
            voter = voter,
            is_active = True
        ).first()
    )
    
    if existing_session:
        return existing_session
    
    
    session = VottingSession.objects.create(
        voter=voter,
        expires_at = timezone.now()
        + timedelta(minutes=30)
    )
       
    return session



def validate_session(token):
    session = (
        VottingSession.objects.filter(session_token=token, is_active=True).first()
    )
    
    if not session:
        raise ValueError(
            "Invalid session."
        )
        
    if session.expires_at < timezone.now():
        raise ValueError(
            "Session expired"
        )
        
    return session

def invalidare_session(session):
    session.is_active = False
    session.save(update_fields=["is_used"])
    
    # raise ValueError("Session expired.")
    
    
def create_vote_receipt(voter):
    receipt = VoteReceipt.objects.create(voter =voter)
    
    return receipt

def mark_voter_voted(voter):
    voter.has_voted = True
    voter.save(update_fields=["is_used"])
    
    
