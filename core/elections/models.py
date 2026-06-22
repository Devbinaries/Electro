from django.db import models
import uuid
# Create your models here.

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
    
    title = models.CharField(max_length=
                             255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=ElectionStatus.choices, default=ElectionStatus.DRAFT)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_locked =models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at= models.DateTimeField(auto_now=True)
    
    
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
        