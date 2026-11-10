from django.conf import settings
from django.db import models


class VoiceSession(models.Model):
    MODES = [
        ('conversation', 'Free Conversation'),
        ('english_practice', 'English Practice'),
        ('interview_simulation', 'Interview Simulation'),
        ('daily_exercise', 'Daily Exercise'),
        ('topic_challenge', 'Topic Challenge'),
    ]
    STATUSES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='voice_sessions')
    mode = models.CharField(max_length=30, choices=MODES, default='conversation')
    topic = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUSES, default='active')
    demo = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.user.email} — {self.mode} ({self.started_at:%Y-%m-%d})'


class VoiceMessage(models.Model):
    SPEAKERS = [('ai', 'AI'), ('user', 'User')]

    session = models.ForeignKey(VoiceSession, on_delete=models.CASCADE, related_name='messages')
    speaker = models.CharField(max_length=10, choices=SPEAKERS)
    text = models.TextField()
    metrics = models.JSONField(default=dict, blank=True)
    feedback = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']

    def __str__(self):
        return f'{self.speaker}: {self.text[:50]}'


class CommunicationReport(models.Model):
    session = models.OneToOneField(VoiceSession, on_delete=models.CASCADE, related_name='report')
    fluency_score = models.FloatField(default=0)
    grammar_score = models.FloatField(default=0)
    pronunciation_score = models.FloatField(default=0)
    confidence_score = models.FloatField(default=0)
    vocabulary_score = models.FloatField(default=0)
    overall_score = models.FloatField(default=0)
    strengths = models.JSONField(default=list, blank=True)
    improvements = models.JSONField(default=list, blank=True)
    grammar_corrections = models.JSONField(default=list, blank=True)
    detailed_feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Report for session {self.session_id} — {self.overall_score}/100'