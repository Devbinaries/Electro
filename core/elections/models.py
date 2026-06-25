from django.db import models
import uuid
# Create your models here.
from voters.models import ElectionVoter

POSITION_CHOICES = [
    ("SRC_PRESIDENT","SRC President"),
    ("SRC_VICE","SRC Vice President"),
    ("SRC_SECRETARY","SRC Secretary"),
    ("SRC_ORGANISER","SRC Orangiser"),
    ("SRC_TREASURER","SRC Treasurer"),
]

class Votes(models.Model):
    "A submodel to represent the votes cast in an election."
    
    election = models.ForeignKey("Election", on_delete=models.CASCADE)
    votes = models.IntegerField(auto_created=True,default=0)
    voter = models.ForeignKey(ElectionVoter,on_delete=models.CASCADE)


    class Meta:
        verbose_name_plural = "Votes"

    def __str__(self):
        return f'Ballot {self.election_id}'
    
    def save(self, force_insert = ..., force_update = ..., using = ..., update_fields = ...):
        if self.pk:
            old = Votes.objects.get(pk=self.pk)
            if old.voter != self.voter:
                raise ValueError(
                    "Voter cannot be changed once a vote is cast"
                )
            
        if self.voter.election != self.election:
            raise ValueError("Voter does not belong to this election")

        if self.voter:
            self.votes += 1

        if self.votes< 0:
            raise ValueError("Votes cannot be negative")

        return super().save(force_insert, force_update, using, update_fields)  


class Candidate(models.Model):
    """Candidate to be elected."""
    name = models.CharField(max_length=50)
    photo = models.ImageField(upload_to="photos")
    position = models.CharField(max_length=20,choices=POSITION_CHOICES)
    votes = models.ForeignKey("Votes", on_delete=models.CASCADE)

    def __str__(self):
        return f'Candidate{self.name}'

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
    status = models.CharField(max_length=20, choices=ElectionStatus.choices, default=ElectionStatus.DRAFT)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_locked =models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at= models.DateTimeField(auto_now=True)
    candidate = models.ForeignKey(Candidate,on_delete=models.CASCADE,default = None)
    
    
    def save(self, *args, **kwargs):
        if self.pk:
            old = Election.objects.get(pk=self.pk)
            
            if old.is_lock and (
                old.title != self.title
                or old.start_date != self.start_date
                or old.end_date != self.end_date
            ):
                raise ValueError(
                    "Locked elections cannot be modified"
                )
                
        super().save(*args, **kwargs)
        
    def lock_election(self):
        if self.status != ElectionStatus.Draft:
            raise ValueError(
                ",Only draft election can be locked"
            )
            
        self.status = ElectionStatus.LOCKED
        self.is_locked = True
        self.save(update_fields=["status", "is_locked"])
        
        
    def activate_election(self):
        
        if self.status != ElectionStatus.LOCKED:
            raise ValueError(
                "Election must be locked before activation"
            )   
            
        self.staus = ElectionStatus.ACTIVE
        self.save(update_fields=["status"])
        
    def close_election(self):
        
        if self.status != ElectionStatus.ACTIVE:
            raise ValueError(
                "only active elections can be closed."
            )
            
        self.status = ElectionStatus.CLOSED
        self.save(update_fields=["status"])
        
    def __str__(self):
        return f"{self.title} ({self.status})"

 