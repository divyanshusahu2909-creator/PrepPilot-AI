"""
Models for the resumes app.
"""

from django.db import models
from django.conf import settings


class Resume(models.Model):
    """Uploaded resume document."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='resumes',
        verbose_name='User',
    )
    file = models.FileField(upload_to='resumes/', verbose_name='Resume File')
    filename = models.CharField(max_length=255, verbose_name='Original Filename')
    file_size = models.IntegerField(verbose_name='File Size (bytes)')
    extracted_text = models.TextField(blank=True, verbose_name='Extracted Text')
    uploaded_at = models.DateTimeField(auto_now_add=True, verbose_name='Uploaded At')
    is_active = models.BooleanField(
        default=True,
        verbose_name='Is Active',
        help_text='True means this is the latest/primary resume.',
    )

    class Meta:
        verbose_name = 'Resume'
        verbose_name_plural = 'Resumes'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.user.email} - {self.filename} ({self.uploaded_at.strftime('%Y-%m-%d')})"

    @property
    def file_size_mb(self):
        """Return file size in MB."""
        return round(self.file_size / (1024 * 1024), 2)

    def save(self, *args, **kwargs):
        """When saving a new active resume, deactivate all others for this user."""
        if self.is_active and not self.pk:
            Resume.objects.filter(user=self.user, is_active=True).update(is_active=False)
        super().save(*args, **kwargs)


class ResumeAnalysis(models.Model):
    """AI-generated analysis of a resume."""

    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name='analyses',
        verbose_name='Resume',
    )
    overall_score = models.IntegerField(verbose_name='Overall Score (0-100)')
    ats_score = models.IntegerField(verbose_name='ATS Compatibility Score (0-100)')
    ats_disclaimer = models.TextField(
        blank=True,
        default='This ATS score is an AI estimate of resume formatting compatibility and does not represent any specific company\'s actual ATS system score.',
        verbose_name='ATS Disclaimer',
    )
    skills_found = models.JSONField(default=list, verbose_name='Skills Found')
    missing_skills = models.JSONField(default=list, verbose_name='Missing Skills')
    education_feedback = models.TextField(blank=True, verbose_name='Education Feedback')
    experience_feedback = models.TextField(blank=True, verbose_name='Experience Feedback')
    grammar_issues = models.JSONField(default=list, verbose_name='Grammar Issues')
    formatting_issues = models.JSONField(default=list, verbose_name='Formatting Issues')
    improvements = models.JSONField(default=list, verbose_name='Suggested Improvements')
    improved_summary = models.TextField(blank=True, verbose_name='Improved Summary')
    strengths = models.JSONField(default=list, verbose_name='Strengths')
    weaknesses = models.JSONField(default=list, verbose_name='Weaknesses')
    raw_analysis = models.JSONField(default=dict, verbose_name='Raw AI Analysis')
    analyzed_at = models.DateTimeField(auto_now_add=True, verbose_name='Analyzed At')

    class Meta:
        verbose_name = 'Resume Analysis'
        verbose_name_plural = 'Resume Analyses'
        ordering = ['-analyzed_at']

    def __str__(self):
        return f"Analysis of {self.resume.filename} - Score: {self.overall_score}/100"
