import csv
import io
import secrets
from datetime import timedelta
from pathlib import Path

import openpyxl
from django.core.exceptions import ValidationError
from django.db import transaction
from django.apps import apps
from django.utils import timezone
from elections.models import Election, ElectionStatus
from .models import ElectionVoter, VoteReceipt, VoterVerification, VotingSession

MAX_VOTER_IMPORT_SIZE = 15 * 1024 * 1024
REQUIRED_VOTER_IMPORT_COLUMNS = {"student_id", "first_name", "last_name", "email", "department"}
ALLOWED_VOTER_IMPORT_EXTENSIONS = {".csv", ".xlsx"}


def _audit_log_model():
    return apps.get_model("elections", "ElectionAuditLog")


def log_voter_audit(*, voter, action, metadata=None):
    return _audit_log_model().objects.create(
        election=voter.election,
        voter=voter,
        action=action,
        metadata=metadata or {},
    )


def parse_voter_import_file(uploaded_file):
    if not uploaded_file:
        raise ValidationError("A file is required.")

    if uploaded_file.size > MAX_VOTER_IMPORT_SIZE:
        raise ValidationError("The import file must be 15MB or smaller.")

    extension = Path(uploaded_file.name).suffix.lower()
    if extension not in ALLOWED_VOTER_IMPORT_EXTENSIONS:
        raise ValidationError("Only CSV (.csv) and Excel (.xlsx) files are allowed.")

    if extension == ".csv":
        try:
            uploaded_file.seek(0)
            decoded = uploaded_file.read().decode("utf-8-sig")
            reader = csv.DictReader(io.StringIO(decoded))
            headers = [header.strip() for header in (reader.fieldnames or [])]
            rows = list(reader)
        except Exception as exc:
            raise ValidationError(f"Invalid CSV file: {exc}") from exc
    else:
        try:
            uploaded_file.seek(0)
            workbook = openpyxl.load_workbook(uploaded_file, data_only=True, read_only=True)
            worksheet = workbook.active
            iterator = worksheet.iter_rows(values_only=True)
            first_row = next(iterator, None)
            if not first_row:
                raise ValidationError("The spreadsheet is empty.")
            headers = [str(cell).strip() if cell is not None else "" for cell in first_row]
            rows = [dict(zip(headers, row)) for row in iterator]
        except ValidationError:
            raise
        except Exception as exc:
            raise ValidationError(f"Invalid Excel file: {exc}") from exc

    missing_columns = REQUIRED_VOTER_IMPORT_COLUMNS - set(headers)
    if missing_columns:
        raise ValidationError({"missing_columns": sorted(missing_columns)})

    return rows


def import_voters_from_rows(*, election, rows):
    normalized_rows = []
    file_student_ids = set()
    file_emails = set()
    row_errors = []

    for index, row in enumerate(rows, start=2):
        student_id = str(row.get("student_id", "")).strip()
        first_name = str(row.get("first_name", "")).strip()
        last_name = str(row.get("last_name", "")).strip()
        email = str(row.get("email", "")).strip().lower()
        department = str(row.get("department", "")).strip()

        if not all([student_id, first_name, last_name, email, department]):
            row_errors.append({"row": index, "error": "All required columns must have values."})
            continue

        if student_id in file_student_ids:
            row_errors.append({"row": index, "error": f"Duplicate student_id in file: {student_id}"})
        if email in file_emails:
            row_errors.append({"row": index, "error": f"Duplicate email in file: {email}"})

        file_student_ids.add(student_id)
        file_emails.add(email)
        normalized_rows.append({
            "student_id": student_id,
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "department": department,
        })

    if row_errors:
        raise ValidationError({"row_errors": row_errors})

    existing_student_ids = set(
        ElectionVoter.objects.filter(
            election=election,
            student_id__in=file_student_ids,
        ).values_list("student_id", flat=True)
    )
    existing_emails = set(
        ElectionVoter.objects.filter(
            election=election,
            email__in=file_emails,
        ).values_list("email", flat=True)
    )

    if existing_student_ids or existing_emails:
        raise ValidationError({
            "existing_student_ids": sorted(existing_student_ids),
            "existing_emails": sorted(existing_emails),
        })

    created_voters = []
    with transaction.atomic():
        for row in normalized_rows:
            created_voters.append(
                ElectionVoter.objects.create(
                    election=election,
                    student_id=row["student_id"],
                    first_name=row["first_name"],
                    last_name=row["last_name"],
                    email=row["email"],
                    department=row["department"],
                )
            )

    return created_voters

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
            "An active verification code already exists"
        )
        
    otp = generate_otp()
    
    verification = VoterVerification.objects.create(
        voter = voter, 
        verification_code= otp,
        expires_at = timezone.now() + timedelta(minutes=5)
        
    )
    
    
    return verification, otp



def verify_otp(voter,otp):
    """Verify OTP and create a voting session."""
    
    verification = (
        VoterVerification.objects.filter(
            voter = voter,
            verification_code = otp,
            is_used = False
        )
        .order_by("-created_at")
        .first()
    )
    
    if not verification:
        log_voter_audit(
            voter=voter,
            action="FRAUD_ATTEMPT",
            metadata={"type": "invalid_otp"},
        )
        raise ValueError("Invalid verification code")
    
    
    if verification.expires_at < timezone.now():
        log_voter_audit(
            voter=voter,
            action="FRAUD_ATTEMPT",
            metadata={"type": "expired_otp"},
        )
        raise ValueError(
            "Verification code expired."
        )
        
    verification.is_used = True
    verification.save(update_fields=["is_used"])
    
    voter.is_verified = True
    voter.save(update_fields=["is_verified"])

    return create_voting_session(voter)


def create_voting_session(voter):
    """
    Create a voting session after verification.
    """
    
    if voter.has_voted:
        raise ValueError(
            "Vote already cast."
    )
    
    if not voter.is_verified:
        raise ValueError(
            "Verification required"
        )   
        
    VotingSession.objects.filter(
        voter=voter,
        is_active=True,
        expires_at__lt=timezone.now()
    ).update(is_active=False)

    existing_session = (
        VotingSession.objects.filter(
            voter = voter,
            is_active = True,
            expires_at__gt=timezone.now()
        ).first()
    )
    
    if existing_session:
        return existing_session
    
    
    session = VotingSession.objects.create(
        voter=voter,
        expires_at = timezone.now()
        + timedelta(minutes=30)
    )

    log_voter_audit(
        voter=voter,
        action="SESSION_CREATED",
        metadata={"type": "otp_verified"},
    )
       
    return session



def validate_session(token):
    session = (
        VotingSession.objects.filter(session_token=token, is_active=True).first()
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


def get_active_election_for_voter_verification(election_id=None):
    queryset = Election.objects.all().order_by("-created_at")
    if election_id:
        election = queryset.filter(election_id=election_id).first()
        if not election:
            raise ValueError("Election is not active")
    else:
        election = queryset.first()
        if not election:
            raise ValueError("No active election")

    election.sync_status_from_schedule()
    if election.status != ElectionStatus.ACTIVE:
        if election_id:
            raise ValueError("Election is not active")
        for candidate in queryset.exclude(pk=election.pk):
            candidate.sync_status_from_schedule()
            if candidate.status == ElectionStatus.ACTIVE:
                return candidate
        raise ValueError("No active election")
    return election

def invalidate_session(session):
    session.is_active = False
    session.save(update_fields=["is_active"])
    
    
def create_vote_receipt(voter):
    receipt = VoteReceipt.objects.create(voter =voter)
    
    return receipt

def mark_voter_voted(voter):
    voter.has_voted = True
    voter.save(update_fields=["has_voted"])
    
    
