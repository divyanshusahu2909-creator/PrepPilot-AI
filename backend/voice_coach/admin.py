from django.contrib import admin

from .models import CommunicationReport, VoiceMessage, VoiceSession


@admin.register(VoiceSession)
class VoiceSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'mode', 'status', 'started_at', 'duration_seconds']
    list_filter = ['mode', 'status']
    search_fields = ['user__email']


@admin.register(VoiceMessage)
class VoiceMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'speaker', 'created_at']
    list_filter = ['speaker']


@admin.register(CommunicationReport)
class CommunicationReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'overall_score', 'created_at']