from collections import defaultdict

from django.db.models import Count
from django.db.models.functions import TruncDate, TruncHour
from django.utils import timezone

from authentication.models import User, UserRole
from elections.models import Election, ElectionAuditLog, Vote
from voters.models import ElectionVoter


def _election_turnout(election):
    total_voters = ElectionVoter.objects.filter(election=election).count()
    voted_voters = ElectionVoter.objects.filter(election=election, has_voted=True).count()
    if total_voters == 0:
        return 0.0
    return round((voted_voters / total_voters) * 100, 2)


def get_platform_summary():
    elections = Election.objects.all()
    total_voters = ElectionVoter.objects.count()
    voted_voters = ElectionVoter.objects.filter(has_voted=True).count()
    turnout = round((voted_voters / total_voters) * 100, 2) if total_voters > 0 else 0.0

    return {
        "total_users": User.objects.count(),
        "total_elections": elections.count(),
        "draft_elections": elections.filter(status="DRAFT").count(),
        "locked_elections": elections.filter(status="LOCKED").count(),
        "active_elections": elections.filter(status="ACTIVE").count(),
        "closed_elections": elections.filter(status="CLOSED").count(),
        "total_electoral_officers": User.objects.filter(role=UserRole.ELECTORAL_OFFICER).count(),
        "active_electoral_officers": User.objects.filter(
            role=UserRole.ELECTORAL_OFFICER, is_active=True
        ).count(),
        "total_auditors": User.objects.filter(role=UserRole.AUDITOR).count(),
        "total_registered_voters": total_voters,
        "total_votes_cast": voted_voters,
        "overall_turnout_percentage": turnout,
    }


def _election_audit_chart_data(audit_logs):
    audit_over_time = list(
        audit_logs.annotate(date=TruncDate("timestamp"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )
    verification_events = audit_logs.filter(action="SESSION_CREATED").count()
    failed_verifications = audit_logs.filter(action="FRAUD_ATTEMPT").count()

    otp_over_time = list(
        audit_logs.filter(action="SESSION_CREATED")
        .annotate(date=TruncDate("timestamp"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )

    action_breakdown = list(
        audit_logs.values("action").annotate(count=Count("id")).order_by("-count")
    )

    return {
        "audit_events": audit_logs.count(),
        "verification_events": verification_events,
        "failed_verification_attempts": failed_verifications,
        "otp_requests": verification_events,
        "audit_events_over_time": [
            {"date": item["date"].isoformat() if item["date"] else None, "count": item["count"]}
            for item in audit_over_time
        ],
        "verification_breakdown": [
            {"label": "Success", "count": verification_events},
            {"label": "Failure", "count": failed_verifications},
        ],
        "otp_requests_over_time": [
            {"date": item["date"].isoformat() if item["date"] else None, "count": item["count"]}
            for item in otp_over_time
        ],
        "audit_action_breakdown": [
            {"action": item["action"], "count": item["count"]} for item in action_breakdown
        ],
    }


def get_election_analytics(election):
    base = get_officer_election_analytics(election)
    audit_logs = ElectionAuditLog.objects.filter(election=election)
    audit_data = _election_audit_chart_data(audit_logs)

    return {
        **base,
        **audit_data,
        "recent_activity": _build_activity_timeline(election=election, limit=30),
    }


def get_platform_analytics():
    status_distribution = list(
        Election.objects.values("status").annotate(count=Count("id")).order_by("status")
    )

    timeline = list(
        Election.objects.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )
    elections_timeline = [
        {"date": item["date"].isoformat() if item["date"] else None, "count": item["count"]}
        for item in timeline
    ]

    platform_turnout = []
    for election in Election.objects.order_by("-created_at")[:20]:
        platform_turnout.append(
            {
                "election_id": str(election.election_id),
                "title": election.title,
                "turnout_percentage": _election_turnout(election),
            }
        )

    user_distribution = [
        {"role": "Electoral Officers", "count": User.objects.filter(role=UserRole.ELECTORAL_OFFICER).count()},
        {"role": "Auditors", "count": User.objects.filter(role=UserRole.AUDITOR).count()},
    ]

    recent_activity = _build_activity_timeline(limit=30)

    return {
        "election_status_distribution": status_distribution,
        "elections_timeline": elections_timeline,
        "platform_turnout": platform_turnout,
        "user_distribution": user_distribution,
        "recent_activity": recent_activity,
    }


def _build_activity_timeline(*, election=None, limit=30):
    queryset = ElectionAuditLog.objects.select_related("election", "voter").order_by("-timestamp")
    if election:
        queryset = queryset.filter(election=election)

    events = []
    for log in queryset[:limit]:
        voter_label = None
        if log.voter:
            voter_label = log.voter.student_id or log.voter.email
        events.append(
            {
                "id": log.id,
                "type": log.action,
                "election_title": log.election.title,
                "voter": voter_label,
                "metadata": log.metadata,
                "timestamp": log.timestamp.isoformat(),
            }
        )
    return events


def get_officer_election_analytics(election):
    voters = ElectionVoter.objects.filter(election=election)
    total_voters = voters.count()
    voted_voters = voters.filter(has_voted=True).count()
    turnout = round((voted_voters / total_voters) * 100, 2) if total_voters > 0 else 0.0

    results = (
        Vote.objects.filter(election=election)
        .values("position_id", "position__name", "candidate_id", "candidate__name")
        .annotate(total_votes=Count("id"))
        .order_by("position__name", "-total_votes")
    )

    votes_by_position = defaultdict(int)
    for row in results:
        votes_by_position[row["position__name"]] += row["total_votes"]

    votes_per_candidate = [
        {
            "candidate_id": row["candidate_id"],
            "candidate_name": row["candidate__name"],
            "position_name": row["position__name"],
            "votes": row["total_votes"],
        }
        for row in results
    ]

    vote_logs = (
        ElectionAuditLog.objects.filter(election=election, action="VOTE_CAST")
        .annotate(hour=TruncHour("timestamp"))
        .values("hour")
        .annotate(count=Count("id"))
        .order_by("hour")
    )
    voting_progress = [
        {"timestamp": item["hour"].isoformat() if item["hour"] else None, "votes": item["count"]}
        for item in vote_logs
    ]

    positions_count = election.positions.count()
    candidates_count = election.candidates.count()

    return {
        "election_id": str(election.election_id),
        "title": election.title,
        "status": election.status,
        "assigned_elections": 1,
        "positions": positions_count,
        "candidates": candidates_count,
        "registered_voters": total_voters,
        "votes_cast": voted_voters,
        "turnout_percentage": turnout,
        "remaining_voters": total_voters - voted_voters,
        "live_turnout": {
            "voted": voted_voters,
            "total": total_voters,
            "percentage": turnout,
        },
        "votes_by_position": [
            {"position": name, "votes": count} for name, count in votes_by_position.items()
        ],
        "votes_per_candidate": votes_per_candidate,
        "voting_progress_over_time": voting_progress,
    }


def get_auditor_analytics(*, user, election=None):
    elections_qs = Election.objects.filter(auditors=user)
    if election:
        elections_qs = elections_qs.filter(pk=election.pk)

    audit_logs = ElectionAuditLog.objects.filter(election__in=elections_qs)
    if election:
        audit_logs = audit_logs.filter(election=election)

    verification_events = audit_logs.filter(action="SESSION_CREATED").count()
    failed_verifications = audit_logs.filter(action="FRAUD_ATTEMPT").count()
    otp_requests = audit_logs.filter(action="SESSION_CREATED").count()
    votes_recorded = audit_logs.filter(action="VOTE_CAST").count()
    suspicious_events = failed_verifications

    audit_over_time = list(
        audit_logs.annotate(date=TruncDate("timestamp"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )
    audit_events_over_time = [
        {"date": item["date"].isoformat() if item["date"] else None, "count": item["count"]}
        for item in audit_over_time
    ]

    verification_breakdown = [
        {"label": "Success", "count": verification_events},
        {"label": "Failure", "count": failed_verifications},
    ]

    otp_over_time = list(
        audit_logs.filter(action="SESSION_CREATED")
        .annotate(date=TruncDate("timestamp"))
        .values("date")
        .annotate(count=Count("id"))
        .order_by("date")
    )
    otp_requests_over_time = [
        {"date": item["date"].isoformat() if item["date"] else None, "count": item["count"]}
        for item in otp_over_time
    ]

    vote_timeline = list(
        audit_logs.filter(action="VOTE_CAST")
        .annotate(hour=TruncHour("timestamp"))
        .values("hour")
        .annotate(count=Count("id"))
        .order_by("hour")
    )
    vote_submission_timeline = [
        {"timestamp": item["hour"].isoformat() if item["hour"] else None, "votes": item["count"]}
        for item in vote_timeline
    ]

    turnout_trend = []
    for el in elections_qs.order_by("-created_at")[:10]:
        turnout_trend.append(
            {
                "election_id": str(el.election_id),
                "title": el.title,
                "turnout_percentage": _election_turnout(el),
            }
        )

    return {
        "assigned_elections": elections_qs.count(),
        "audit_events": audit_logs.count(),
        "verification_events": verification_events,
        "otp_requests": otp_requests,
        "votes_recorded": votes_recorded,
        "failed_verification_attempts": failed_verifications,
        "suspicious_events": suspicious_events,
        "audit_events_over_time": audit_events_over_time,
        "verification_breakdown": verification_breakdown,
        "otp_requests_over_time": otp_requests_over_time,
        "vote_submission_timeline": vote_submission_timeline,
        "turnout_trend": turnout_trend,
    }


def get_observer_analytics(election):
    results = (
        Vote.objects.filter(election=election)
        .values("position_id", "position__name", "candidate_id", "candidate__name")
        .annotate(total_votes=Count("id"))
        .order_by("position__name", "-total_votes")
    )

    total_voters = ElectionVoter.objects.filter(election=election).count()
    voted_voters = ElectionVoter.objects.filter(election=election, has_voted=True).count()
    turnout = round((voted_voters / total_voters) * 100, 2) if total_voters > 0 else 0.0

    vote_distribution = defaultdict(int)
    for row in results:
        vote_distribution[row["position__name"]] += row["total_votes"]

    candidates = [
        {
            "candidate_id": row["candidate_id"],
            "candidate_name": row["candidate__name"],
            "position_name": row["position__name"],
            "votes": row["total_votes"],
        }
        for row in results
    ]

    vote_progress = list(
        ElectionAuditLog.objects.filter(election=election, action="VOTE_CAST")
        .annotate(hour=TruncHour("timestamp"))
        .values("hour")
        .annotate(count=Count("id"))
        .order_by("hour")
    )
    turnout_progress = [
        {"timestamp": item["hour"].isoformat() if item["hour"] else None, "votes": item["count"]}
        for item in vote_progress
    ]

    return {
        "election_id": str(election.election_id),
        "title": election.title,
        "status": election.status,
        "description": election.description,
        "live_turnout": {
            "voted": voted_voters,
            "total": total_voters,
            "percentage": turnout,
        },
        "candidates": candidates,
        "vote_distribution": [
            {"position": name, "votes": count} for name, count in vote_distribution.items()
        ],
        "turnout_progress": turnout_progress,
        "results": list(results),
    }
