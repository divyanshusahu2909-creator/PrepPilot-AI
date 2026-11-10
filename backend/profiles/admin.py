"""
Admin configuration for the profiles app.
"""

from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """Admin panel for UserProfile."""

    list_display = ['user', 'target_role', 'experience_level', 'location', 'graduation_year', 'created_at']
    list_filter = ['experience_level', 'graduation_year']
    search_fields = ['user__email', 'target_role', 'location', 'college']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['user']
