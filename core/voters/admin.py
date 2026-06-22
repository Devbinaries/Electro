from django.contrib import admin

from .models import (
    ElectionVoter,
    VoterVerification,
    VottingSession,
    VoteReceipt,
)

@admin.register(ElectionVoter)
class ElectionVoterAdmin(admin.ModelAdmin):
    list_display = (
        "student_id",
        "first_name",
        "last_name",
        "email",
        "department",
        "is_verified",
        "has_voted",
        "election",
    )

    list_filter = (
        "is_verified",
        "has_voted",
        "department",
        "election",
    )

    search_fields = (
        "student_id",
        "email",
        "first_name",
        "last_name",
    )
    
@admin.register(VoterVerification)
class VoterVerificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "voter",
        "verification_code",
        "is_used",
        "expires_at",
        "created_at",
    )

    list_filter = (
        "is_used",
    )

    readonly_fields = (
        "created_at",
    )
    
@admin.register(VottingSession)
class VottingSessionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "voter",
        "session_token",
        "is_active",
        "expires_at",
        "created_at",
    )

    list_filter = (
        "is_active",
    )

    readonly_fields = (
        "session_token",
        "created_at",
    )
    
@admin.register(VoteReceipt)
class VoteReceiptAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "receipt_number",
        "voter",
        "submitted_at",
    )

    readonly_fields = (
        "receipt_number",
        "submitted_at",
    )