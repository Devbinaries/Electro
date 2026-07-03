from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.

class UserRole(models.TextChoices):
    ADMIN = ("ADMIN", "admin")
    ELECTORAL_OFFICER = ("ELECTORAL_OFFICER", "Electoral Officer")
    AUDITOR = ("AUDITOR","Auditor")
    
class User(AbstractUser):
    role = models.CharField(max_length=30, choices=UserRole.choices, help_text="Internal system role.")
    email = models.EmailField(max_length=100, unique=True)
    must_change_password = models.BooleanField(default=True, help_text="Designates whether the user must change their password on login.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS =["username"]
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "User"
        verbose_name_plural = "Users"
        
    def __str__(self):
        return(
            f"{self.get_full_name() or self.email} ({self.role})"
        )
        
    @property
    def is_electoral_officer(self):
        return self.role == UserRole.ELECTORAL_OFFICER
    
    
    @property
    def is_auditor(self):
        return self.role == UserRole.AUDITOR
    
    
class Profile(models.Model):
    """Extended user information(internal staff only)"""
    
    user = models.OneToOneField(User,on_delete=models.CASCADE, related_name="profile")
    full_name = models.CharField(max_length=255)
    staff_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)
    profile_image = models.ImageField(upload_to="profiles/", null=True, blank= True)
    is_verified = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(
        auto_now_add=True
    )
    updated_at = models.DateTimeField(
        auto_now=True
    )
    
    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Profile"
        verbose_name_plural = "Profile"
        
    def __str__(Self):
        return f"{self.full_name}-{self.user.email}"
    
    