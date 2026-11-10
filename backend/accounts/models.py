"""
Custom User model for PrepPilot AI.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class CustomUserManager(BaseUserManager):
    """Manager for custom User model using email as the unique identifier."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set.')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', 'user')
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('email_verified', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model for PrepPilot AI platform."""

    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Admin'),
    ]

    email = models.EmailField(unique=True, db_index=True, verbose_name='Email Address')
    first_name = models.CharField(max_length=150, blank=True, verbose_name='First Name')
    last_name = models.CharField(max_length=150, blank=True, verbose_name='Last Name')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user', verbose_name='Role')
    is_active = models.BooleanField(default=True, verbose_name='Active')
    is_staff = models.BooleanField(default=False, verbose_name='Staff Status')
    is_superuser = models.BooleanField(default=False, verbose_name='Superuser Status')
    email_verified = models.BooleanField(default=False, verbose_name='Email Verified')
    date_joined = models.DateTimeField(default=timezone.now, verbose_name='Date Joined')
    last_login = models.DateTimeField(null=True, blank=True, verbose_name='Last Login')

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.email} ({self.get_full_name() or 'No Name'})"

    def get_full_name(self):
        """Return the first and last name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name or self.email.split('@')[0]

    @property
    def is_admin(self):
        """Return True if user has admin role."""
        return self.role == 'admin'


class UserActivity(models.Model):
    """Tracks user activities for analytics."""

    ACTIVITY_TYPES = [
        ('resume_upload', 'Resume Upload'),
        ('resume_analyzed', 'Resume Analyzed'),
        ('interview_started', 'Interview Started'),
        ('interview_completed', 'Interview Completed'),
        ('voice_session', 'Voice Session'),
        ('roadmap_generated', 'Roadmap Generated'),
        ('login', 'Login'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities', verbose_name='User')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES, verbose_name='Activity Type')
    description = models.CharField(max_length=500, blank=True, verbose_name='Description')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='Metadata')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created At')

    class Meta:
        verbose_name = 'User Activity'
        verbose_name_plural = 'User Activities'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.activity_type} at {self.created_at}"

    @classmethod
    def log(cls, user, activity_type, description='', metadata=None):
        """Convenience class method to log an activity."""
        return cls.objects.create(
            user=user,
            activity_type=activity_type,
            description=description,
            metadata=metadata or {},
        )
