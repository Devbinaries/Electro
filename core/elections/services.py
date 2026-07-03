from django.db import transaction
from django.db import models
from django.utils import timezone
from django.db.models import Count
from django.core.cache import cache
from django.apps import apps

from voters.models import VoteReceipt, VotingSession


def _election_model():
    return apps.get_model("elections", "Election")


def _position_model():
    return apps.get_model("elections", "Position")


def _candidate_model():
    return apps.get_model("elections", "Candidate")


def _vote_model():
    return apps.get_model("elections", "Vote")


def _audit_log_model():
    return apps.get_model("elections", "ElectionAuditLog")

def prevent_vote_spam(voter):
    key = f"vote_{voter.id}"
    
    if cache.get(key):
        raise ValueError("Too many requests")
    
    cache.set(key, True, timeout=5)

def ensure_election_is_active(election):
    if election.status != "ACTIVE":
        raise ValueError("Election is not active.")


def sync_election_status(election, now=None):
    return election.sync_status_from_schedule(now=now)
    
    
def validate_voting_session(session_token,election):
    session = VotingSession.objects.filter(
        session_token = session_token,
        is_active = True
    ).first()
    
    if not session:
        log_audit(
            election=election,
            action="FRAUD_ATTEMPT",
            metadata={"type": "invalid_session"},
        )
        raise ValueError("Invalid or expired voting session")
    
    if session.expires_at < timezone.now():
        log_audit(
            election=election,
            voter=session.voter,
            action="FRAUD_ATTEMPT",
            metadata={"type": "expired_session_use"},
        )
        raise ValueError("Voting session expired")
    
    voter = session.voter
    
    if voter.election_id != election.id:
        log_audit(
            election=election,
            voter=voter,
            action="FRAUD_ATTEMPT",
            metadata={"type": "cross_election_access"},
        )
        raise ValueError("Voter not assigned to this session")

    if voter.has_voted:
        log_audit(
            election=election,
            voter=voter,
            action="FRAUD_ATTEMPT",
            metadata={"type": "repeat_vote_attempt"},
        )
        raise ValueError("This voter has already voted.")
    
    return session, voter


def ensure_no_duplicate_vote(election, position, voter):
    exists = _vote_model().objects.filter(
        election=election,
        position=position,
        voter = voter
    ).exists()
    
    if exists:
        log_audit(
            election=election,
            voter=voter,
            action="FRAUD_ATTEMPT",
            metadata={"type": "duplicate_position_vote", "position_id": position.id},
        )
        raise ValueError("You have already voted for this position.")
    
def validate_candidate(election, position,candidate_id):
    candidate = _candidate_model().objects.filter(
        id = candidate_id,
        election=election,
        position = position
    ).first()
    
    if not candidate:
        raise ValueError("Invalid candidate.")
    
    return candidate


def cast_vote(*, session_token, election_id, votes):
    
    if not session_token or not election_id or not votes:
        raise ValueError("Missing required voting parameters.")
    
    if not isinstance(votes, list):
        raise ValueError("Invalid payload structure")
    
    election = _election_model().objects.filter(election_id=election_id).first()
    
    if not election:
        raise ValueError("Election not found")
    
    if election.status != "ACTIVE":
        raise ValueError("Election is not active.")
    
    session, voter = validate_voting_session(session_token,election)
    
    prevent_vote_spam(voter)

    created_votes = []
    used_positions = set()
    
    with transaction.atomic():
        for vote_payload in votes:
            position_id = vote_payload.get("position_id")
            candidate_id = vote_payload.get("candidate_id")

            if not position_id or not candidate_id:
                raise ValueError("Each vote must include position_id and candidate_id.")

            if position_id in used_positions:
                raise ValueError("Only one candidate can be selected per position.")

            position = _position_model().objects.filter(
                id=position_id, election=election
            ).first()
            
            if not position:
                raise ValueError("Invalid position")
            
            ensure_no_duplicate_vote(election, position, voter)
            candidate = validate_candidate(election, position, candidate_id)

            created_votes.append(
                _vote_model().objects.create(
                    election=election,
                    position=position,
                    candidate=candidate,
                    voter=voter
                )
            )
            used_positions.add(position_id)

        voter.has_voted = True
        voter.save(update_fields=["has_voted"])

        receipt, _ = VoteReceipt.objects.get_or_create(voter=voter)
        session.is_active = False
        session.save(update_fields=["is_active"])
        
    log_audit(
        election=election,
        voter=voter,
        action="VOTE_CAST",
        metadata={"candidate_ids":[vote.candidate_id for vote in created_votes]}
    )
        
    return {
        "votes": created_votes,
        "receipt": receipt,
        "voter": voter,
        "session": session,
        "election": election,
    }


def get_Results(election):
    results = (
        _vote_model().objects.filter(election=election)
        .values("candidate_id", "candidate_name","position_name")
        .annotate(total_votes = models.Count("id"))
        .order_by("-total_votes")
    )
    
    return results

def get_turnout(election):
    total_votes = _vote_model().objects.filter(election=election).count()
    
    total_voters = election.voter.count()
    
    if total_voters == 0:
        return 0
    
    return (total_votes / total_voters) * 100


def log_audit(*, election,action,voter=None,metadata=None):
    return _audit_log_model().objects.create(
        election=election,voter=voter,action=action,metadata=metadata or {}
    )
    

def detect_duplicate_vote(voter,election,position):
    exists = _vote_model().objects.filter(
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
    
    positions = _position_model().objects.filter(election=election)
    result_data = []
    
    for position in positions:
        candidates = _candidate_model().objects.filter(
            election = election,
            position = position
        )
        
        candidate_results = []
        
        for candidate in candidates:
            vote_count = _vote_model().objects.filter(
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
    
