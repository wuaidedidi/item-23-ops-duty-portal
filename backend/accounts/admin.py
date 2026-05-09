from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from accounts.models import LoginSession, User


@admin.register(User)
class PortalUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("运维门户信息", {"fields": ("role", "display_name", "phone", "department", "last_seen_at")}),
    )
    list_display = ("username", "display_name", "role", "is_active", "last_seen_at")
    list_filter = ("role", "is_active")


@admin.register(LoginSession)
class LoginSessionAdmin(admin.ModelAdmin):
    list_display = ("user", "ip_address", "login_at", "expires_at", "is_active")
    list_filter = ("is_active",)
