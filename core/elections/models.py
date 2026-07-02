from django.db import models
import uuid
from django.utils import timezone
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models.signals import m2m_changed
from django.dispatch import receiver

# Create your models here.
from voters.models import ElectionVoter
from .services import log_audit
from rest_framework.throttling import SimpleRateThrottle

class ElectionStatus(models.TextChoices):
    DRAFT = "DRAFT", "Draft",
    LOCKED = "LOCKED", "Locked",
    ACTIVE = "ACTIVE", "Active",
    CLOSED = "CLOSED", "Closed"
    

class Election(models.Model):
    election_id = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        editable=False 
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    # Assignment fields
    electoral_officer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="elections_as_officer",
        help_text="Electoral officer assigned to manage this election",
    )

    auditors = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="elections_as_auditor",
        help_text="Auditors assigned to this election (max 3)",
    )
    status = models.CharField(max_length=20, choices=ElectionStatus.choices, default=ElectionStatus.DRAFT)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_locked =models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at= models.DateTimeField(auto_now=True)
    # candidate = models.ForeignKey(Candidate,on_delete=models.CASCADE,default = None)
    
    
    def save(self, *args, **kwargs):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError("Start date must be before end date")

        if self.pk:
            old = Election.objects.get(pk=self.pk)
            
            if old.is_locked and (
                old.title != self.title
                or old.start_date != self.start_date
                or old.end_date != self.end_date
            ):
                raise ValueError(
                    "Locked elections cannot be modified"
                )
                
        super().save(*args, **kwargs)
        
    def lock_election(self):
        if self.status != ElectionStatus.DRAFT:
            raise ValueError(
                "Only draft election can be locked"
            )
        # Ensure assignments exist
        if not self.electoral_officer:
            raise ValueError("An electoral officer must be assigned before locking the election")
        if self.auditors.count() < 1:
            raise ValueError("At least one auditor must be assigned before locking the election")
        if self.auditors.count() > 3:
            raise ValidationError("No more than 3 auditors can be assigned to an election")

        self.status = ElectionStatus.LOCKED
        self.is_locked = True
        self.save(update_fields=["status", "is_locked"])
        
        
        log_audit(
            election=self,
            action="ELECTION_LOCKED"
        )
        
        
    def activate_election(self, *, require_validations=True):
        
        if self.status != ElectionStatus.LOCKED:
            raise ValueError(
                "Election must be locked before activation"
            )   
        if require_validations:
            # Ensure assignments still valid
            if not self.electoral_officer:
                raise ValueError("An electoral officer must be assigned before activation")
            if self.auditors.count() < 1:
                raise ValueError("At least one auditor must be assigned before activation")

        self.status = ElectionStatus.ACTIVE
        self.save(update_fields=["status"])
        
        log_audit(
            election=self,
            action="ELECTION_ACTIVATED"
        )

    def sync_status_from_schedule(self, *, now=None):
        return self.status
        
    def close_election(self, *, require_validations=True):
        
        if self.status != ElectionStatus.ACTIVE:
            raise ValueError(
                "only active elections can be closed."
            )
        if require_validations:
            # Only allow closing if assignments still present
            if not self.electoral_officer:
                raise ValueError("An electoral officer must be assigned before closing the election")

        self.status = ElectionStatus.CLOSED
        self.save(update_fields=["status"])
        
        log_audit(
            election=self,
            action="ELECTION_CLOSED"
        )

    def can_accept_changes(self):
        return self.status == ElectionStatus.DRAFT

    def mutation_block_reason(self):
        if self.status == ElectionStatus.LOCKED:
            return "This election is locked. Configuration changes are not allowed."
        if self.status == ElectionStatus.ACTIVE:
            return "This election is active. Configuration changes are not allowed."
        if self.status == ElectionStatus.CLOSED:
            return "This election is closed. No modifications are allowed."
        return None
        
    def __str__(self):
        return f"{self.title} - ({self.status})"


@receiver(m2m_changed, sender=Election.auditors.through)
def enforce_auditor_limit(sender, instance, action, reverse, model, pk_set, **kwargs):
    if action not in {"post_add", "post_remove", "post_clear"}:
        return

    if instance.auditors.count() > 3:
        raise ValidationError("No more than 3 auditors can be assigned to an election")


class Position(models.Model):
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name="positions",null=True, blank=True)
    name = models.CharField(max_length=100,null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    max_winners = models.PositiveIntegerField(default=1)
    
    class Meta:
        unique_together = ("election", "name")
        
    def __str__(self):
        return f"{self.name} ({self.election.title})"
    
    
class Candidate(models.Model):
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name='candidates', null=True, blank=True)
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name="candidates")
    name = models.CharField(max_length=100,null=True, blank=True)
    photo = models.ImageField(upload_to="candidates/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ("election", "position", "name")
        
    def __str__(self):
        return f"{self.name} - ({self.position.name})"
    

class Vote(models.Model):
    election = models.ForeignKey(Election, on_delete=models.CASCADE, related_name="votes",null=True, blank=True)
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name="votes")
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE, related_name="votes")
    voter = models.ForeignKey(ElectionVoter, on_delete=models.CASCADE, related_name="votes")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["election", "position","voter"],
                name = "one_vote_per_position_per_voter"
            )
        ]
        
    def __str__(self):
        return f"{self.voter.student_id}->{self.candidate.name}"
    

class ElectionAuditLog(models.Model):
    class ActionType(models.TextChoices):
        VOTE_CAST = "VOTE_CAST", "Vote Cast"
        SESSION_CREATED = "SESSION_CREATED", "Session Created"
        SESSION_INVALIDATED = "SESSION_INVALIDATED", "Session Invalidated"
        ELECTION_LOCKED = "ELECTION_LOCKED", "Election Locked"
        ELECTION_ACTIVATED = "ELECTION_ACTIVATED", "Election Activated"
        ELECTION_CLOSED = "ELECTION_CLOSED", "Election Closed"
        FRAUD_ATTEMPT = "FRAUD_ATTEMPT", "Fraud Attempt"
        
    election = models.ForeignKey("Election", on_delete=models.CASCADE, related_name="audit_logs")
    voter = models.ForeignKey(
        ElectionVoter, on_delete=models.SET_NULL, null=True, blank=True
    )
    action = models.CharField(max_length=30, choices=ActionType.choices)
    metadata = models.JSONField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.action} - {self.election.title}"