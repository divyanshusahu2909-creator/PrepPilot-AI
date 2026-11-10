"""
Models for the profiles app.
"""

import json
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings


class UserProfile(models.Model):
    """Extended profile information for each user."""

    EXPERIENCE_LEVELS = [
        ('fresher', 'Fresher (0-1 years)'),
        ('junior', 'Junior (1-3 years)'),
        ('mid', 'Mid-level (3-6 years)'),
        ('senior', 'Senior (6+ years)'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='User',
    )
    avatar = models.ImageField(
        upload_to='avatars/',
        null=True,
        blank=True,
        verbose_name='Avatar',
    )
    bio = models.TextField(blank=True, verbose_name='Bio')
    phone = models.CharField(max_length=20, blank=True, verbose_name='Phone Number')
    target_role = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Target Role',
        help_text='e.g. Full Stack Developer, Data Scientist',
    )
    experience_level = models.CharField(
        max_length=20,
        choices=EXPERIENCE_LEVELS,
        default='fresher',
        verbose_name='Experience Level',
    )
    skills = models.TextField(
        blank=True,
        verbose_name='Skills',
        help_text='Comma-separated list of skills or JSON array',
    )
    linkedin_url = models.URLField(blank=True, verbose_name='LinkedIn URL')
    github_url = models.URLField(blank=True, verbose_name='GitHub URL')
    portfolio_url = models.URLField(blank=True, verbose_name='Portfolio URL')
    location = models.CharField(max_length=200, blank=True, verbose_name='Location')
    college = models.CharField(max_length=300, blank=True, verbose_name='College/University')
    graduation_year = models.IntegerField(null=True, blank=True, verbose_name='Graduation Year')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Updated At')

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        ordering = ['-created_at']

    def __str__(self):
        return f"Profile of {self.user.email}"

    def get_skills_list(self):
        """Return skills as a Python list."""
        if not self.skills:
            return []
        # Try parsing as JSON first
        try:
            parsed = json.loads(self.skills)
            if isinstance(parsed, list):
                return parsed
        except (json.JSONDecodeError, ValueError):
            pass
        # Fall back to comma-separated
        return [s.strip() for s in self.skills.split(',') if s.strip()]

    def set_skills_list(self, skills_list):
        """Set skills from a Python list."""
        if isinstance(skills_list, list):
            self.skills = json.dumps(skills_list)
        else:
            self.skills = str(skills_list)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create a UserProfile when a new User is created."""
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile whenever the User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
