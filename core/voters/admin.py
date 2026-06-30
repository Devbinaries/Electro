from django import forms
from django.contrib import admin, messages
from django.core.exceptions import PermissionDenied, ValidationError
from django.shortcuts import redirect, render
from django.urls import path

from elections.models import Election
from .services import parse_voter_import_file, import_voters_from_rows
from .models import (
    ElectionVoter,
    VoterVerification,
    VotingSession,
    VoteReceipt,
)


class VoterImportForm(forms.Form):
    election = forms.ModelChoiceField(queryset=Election.objects.all(), required=True)
    file = forms.FileField(required=True)

@admin.register(ElectionVoter)
class ElectionVoterAdmin(admin.ModelAdmin):
    change_list_template = "admin/voters/electionvoter/change_list.html"

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

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "import/",
                self.admin_site.admin_view(self.import_voters_view),
                name="voters_electionvoter_import",
            )
        ]
        return custom_urls + urls

    def import_voters_view(self, request):
        if not request.user.is_authenticated or not request.user.is_superuser:
            raise PermissionDenied("Only Super Admin can import voters from admin")

        if request.method == "POST":
            form = VoterImportForm(request.POST, request.FILES)
            if form.is_valid():
                election = form.cleaned_data["election"]
                upload = form.cleaned_data["file"]
                try:
                    rows = parse_voter_import_file(upload)
                    created_voters = import_voters_from_rows(election=election, rows=rows)
                    self.message_user(
                        request,
                        f"Imported {len(created_voters)} voters for {election.title}",
                        level=messages.SUCCESS,
                    )
                    return redirect("..")
                except ValidationError as exc:
                    if hasattr(exc, "message_dict"):
                        form.add_error(None, str(exc.message_dict))
                    else:
                        form.add_error(None, exc.messages)
        else:
            form = VoterImportForm()

        context = {
            **self.admin_site.each_context(request),
            "title": "Import voters",
            "form": form,
        }
        return render(request, "admin/voters/electionvoter/import_voters.html", context)
    
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
    
@admin.register(VotingSession)
class VotingSessionAdmin(admin.ModelAdmin):
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