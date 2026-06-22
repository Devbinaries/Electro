from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, Profile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "id",
        "email",
        "username",
        "role",
        "is_active",
        "is_staff",
        "created_at",
    )

    list_filter = (
        "role",
        "is_active",
        "is_staff",
        "is_superuser",
    )

    search_fields = (
        "email",
        "username",
    )

    ordering = ("-created_at",)

    fieldsets = UserAdmin.fieldsets + (
        (
            "Election System",
            {
                "fields": (
                    "role",
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "full_name",
        "staff_id",
        "department",
        "is_verified",
    )

    search_fields = (
        "full_name",
        "staff_id",
        "user__email",
    )

    list_filter = (
        "department",
        "is_verified",
    )