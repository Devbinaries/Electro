from django.db import transaction
from django.utils import timezone
from django.db.models import Count
from django.core.cache import cache
from .models import *

from voters.models import VotingSession

def prevent_vote_spam(voter):
    key = f"vote_{voter.id}"
    
    if cache.get(key):
        raise ValueError("Too many requests")
    
    cache.set(key, True, timeout=5)

def ensure_election_is_active(election:Election):
    if election.status != "ACTIVE":
        raise ValueError("Election is not active.")
    
    
def validate_voting_session(session_token,election):
    session = VotingSession.objects.filter(
        session_token = session_token,
        is_active = True
    ).first()
    
    if not session:
        raise ValueError("Invalid or expired voting session")
    
    if session.expires_at < timezone.now():
        raise ValueError("Voting session expired")
    
    voter = session.voter
    
    if voter.election_id != election.id:
        raise ValueError("Voter not assigned to this session")
    
    return session, voter


def ensure_no_duplicate_vote(election, position, voter):
    exists = Vote.objects.filter(
        election=election,
        position=position,
        voter = voter
    ).exists()
    
    if exists:
        raise ValueError("You have already voted for this position.")
    
def validate_candidate(election, position,candidate_id):
    candidate = Candidate.objects.filter(
        id = candidate_id,
        election=election,
        position = position
    ).first()
    
    if not candidate:
        raise ValueError("Invalid candidate.")
    
    return candidate


def cast_vote(*, session_token, election_id, position_id,candidate_id):
    
    if not all([session_token,election_id,position_id,candidate_id]):
        raise ValueError("Missing required voting parameters.")
    
    if isinstance(candidate_id, list) or isinstance(position_id, list):
        raise ValueError("Invalid payload structure")
    
    election = Election.objects.filter(election_id=election_id).first()
    
    if not election:
        raise ValueError("Election not found")
    
    if election.status != "ACTIVE":
        raise ValueError("Election is not active.")
    
    session, voter = validate_voting_session(session_token,election)
    
    prevent_vote_spam(voter)
    
    # ensure_election_is_active(election)
    
    position = Position.objects.filter(
        id=position_id, election = election
    ).first()
    
    if not position:
        raise ValueError("Invalid position")
    
    ensure_no_duplicate_vote(election, position, voter)
    
    candidate = validate_candidate(election, position, candidate_id)
    
    with transaction.atomic():
        vote = Vote.objects.create(
            election=election,
            position=position,
            candidate=candidate,
            voter=voter
        )
        
        voter.has_voted = True
        voter.save(update_fields=["has_voted"])
        
        session.is_active = False
        session.save(update_fields=["is_active"])
        
    log_audit(
        election=election,
        voter=voter,
        action="VOTE_CAST",
        metadata={"candidate":candidate.id}
    )
        
    return vote


def get_Results(election: Election):
    results = (
        Vote.objects.filter(election=election)
        .values("candidate_id", "candidate_name","position_name")
        .annotate(total_votes = models.Count("id"))
        .order_by("-total_votes")
    )
    
    return results

def get_turnout(election:Election):
    total_votes = Vote.objects.filter(election=election).count()
    
    total_voters = election.voter.count()
    
    if total_voters == 0:
        return 0
    
    return (total_votes / total_voters) * 100


def log_audit(*, election,action,voter=None,metadata=None):
    return ElectionAuditLog.objects.create(
        election=election,voter=voter,action=action,metadata=metadata or {}
    )
    

def detect_duplicate_vote(voter,election,position):
    exists = Vote.objects.filter(
        voter = voter,
        election =election,
        position = position
    ).exists()
    
    if exists:
        log_audit(
            election = election,
            voter = voter,
            action="FRAUD_ATTEMPT",
            metadata={"type":"duplicate_vote"}
        )
        
        raise ValueError("DUplicate vote attempt detected")
    
    
def detect_invalid_session_usage(session):
    if not session.is_active:
        raise ValueError("Session already used or invalid.")
    
    if session.expires_at < timezone.now():
        log_audit(
            election = session.voter.election,
            voter=session.voter,
            action="FRAUD_ATTEMPT",
            metadata={"type":"expired_session_use"}
        )
        
        raise ValueError("Session expired")
    
def detect_cross_election_attempt(voter,election):
    if voter.election_id != election.id:
        log_audit(
            election=election,
            voter=voter,
            action="FRAUD_ATTEMPT",
            metadata={"type":"cross_election_access"}
        )
        
        raise ValueError("Voter not allowed in this election")
    
    
def get_live_results(election):
    """
    Return results in batches
    """
    
    positions = Position.objects.filter(election=election)
    result_data = []
    
    for position in positions:
        candidates = Candidate.objects.filter(
            election = election,
            position = position
        )
        
        candidate_results = []
        
        for candidate in candidates:
            vote_count = Vote.objects.filter(
                election=election,
                position = position,
                candidate= candidate
            ).count()
            
            candidate_results.append({
                "candidate_id":candidate.id,
                "name":candidate.name,
                "votes":vote_count,
            })
        
        candidate_results.sort(key=lambda x: x["votes"], reverse=True)
        
        result_data.append({
            "position":position.name,
            "candidates":candidate_results
        }) 
    return result_data
        

def enforce_single_use_Session(session):
    if session.is_used:
        raise ValueError("session already used")
    