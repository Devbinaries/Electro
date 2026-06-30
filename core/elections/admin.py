from django.contrib import admin
from .models import Election, Position, Candidate, Vote, ElectionAuditLog

@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "status",
        "is_locked",
        "start_date",
        "end_date",
        "created_at",
    )

    list_filter = (
        "status",
        "is_locked",
    )

    search_fields = (
        "title",
    )

    readonly_fields = (
        "election_id",
        "created_at",
        "updated_at",
    )

    actions = ["lock_selected_elections", "activate_selected_elections", "close_selected_elections"]

    def lock_selected_elections(self, request, queryset):
        from django.core.exceptions import PermissionDenied

        if not (request.user.is_authenticated and request.user.role == 'ELECTORAL_OFFICER'):
            raise PermissionDenied("Only the assigned Electoral Officer may lock elections via admin")

        for election in queryset:
            if election.electoral_officer_id != request.user.id:
                raise PermissionDenied("You can only lock elections assigned to you")
            election.lock_election()

    def activate_selected_elections(self, request, queryset):
        from django.core.exceptions import PermissionDenied

        if not (request.user.is_authenticated and request.user.role == 'ELECTORAL_OFFICER'):
            raise PermissionDenied("Only the assigned Electoral Officer may activate elections via admin")

        for election in queryset:
            if election.electoral_officer_id != request.user.id:
                raise PermissionDenied("You can only activate elections assigned to you")
            election.activate_election()

    def close_selected_elections(self, request, queryset):
        from django.core.exceptions import PermissionDenied

        if not (request.user.is_authenticated and request.user.role == 'ELECTORAL_OFFICER'):
            raise PermissionDenied("Only the assigned Electoral Officer may close elections via admin")

        for election in queryset:
            if election.electoral_officer_id != request.user.id:
                raise PermissionDenied("You can only close elections assigned to you")
            election.close_election()

    lock_selected_elections.short_description = "Lock selected elections"
    activate_selected_elections.short_description = "Activate selected elections"
    close_selected_elections.short_description = "Close selected elections"

    def save_related(self, request, form, formsets, change):
        """After m2m saved, enforce auditor count limit."""
        super().save_related(request, form, formsets, change)
        instance = form.instance
        if instance.auditors.count() > 3:
            from django.core.exceptions import ValidationError
            raise ValidationError("No more than 3 auditors can be assigned to an election")

@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "election",
    )

    list_filter = (
        "election",
    )

    search_fields = (
        "name",
        "election__title",
    )
    
@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "election",
        "position",
        "created_at",
    )

    list_filter = (
        "election",
        "position",
    )

    search_fields = (
        "name",
        "election__title",
        "position__name",
    )
    
@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = (
        "voter",
        "candidate",
        "position",
        "election",
        "created_at",
    )

    list_filter = (
        "election",
        "position",
    )

    search_fields = (
        "voter__student_id",
        "candidate__name",
    )

    readonly_fields = (
        "voter",
        "candidate",
        "position",
        "election",
        "created_at",
    )

    def has_add_permission(self, request):
        return False  # votes should NEVER be manually created

    def has_change_permission(self, request, obj=None):
        return False  # votes should NEVER be edited

    def has_delete_permission(self, request, obj=None):
        return False  # votes should NEVER be deleted

@admin.register(ElectionAuditLog)
class ElectionAuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "election",
        "action",
        "voter",
        "timestamp",
    )

    list_filter = (
        "action",
        "election",
        "timestamp",
    )

    search_fields = (
        "voter__student_id",
        "election__title",
    )

    readonly_fields = (
        "id",
        "election",
        "voter",
        "action",
        "metadata",
        "timestamp",
    )

    def has_add_permission(self, request):
        return False  # Audit logs should NEVER be manually created

    def has_change_permission(self, request, obj=None):
        return False  # Audit logs should NEVER be edited

    def has_delete_permission(self, request, obj=None):
        return False  # Audit logs should NEVER be deleted