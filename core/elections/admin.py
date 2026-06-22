from django.contrib import admin

from .models import Election


@admin.register(Election)
class ElectionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
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

    ordering = (
        "-created_at",
    )