from django.contrib import admin

from .models import Resume, ResumeAnalysis


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'filename', 'file_size', 'is_active', 'uploaded_at']
    list_filter = ['is_active']
    search_fields = ['user__email', 'filename']


@admin.register(ResumeAnalysis)
class ResumeAnalysisAdmin(admin.ModelAdmin):
    list_display = ['id', 'resume', 'overall_score', 'ats_score', 'analyzed_at']
    search_fields = ['resume__filename', 'resume__user__email']