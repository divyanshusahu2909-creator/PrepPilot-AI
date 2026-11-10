from django.conf import settings
from django.db import models


class LearningRoadmap(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='roadmaps')
    target_role = models.CharField(max_length=200)
    duration_weeks = models.PositiveIntegerField(default=8)
    demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} — {self.target_role} ({self.duration_weeks}w)'

    @property
    def completion_percentage(self):
        total = self.tasks.count()
        if not total:
            return 0
        return round(self.tasks.filter(status='completed').count() / total * 100)


class RoadmapTask(models.Model):
    STATUSES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    PRIORITIES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]

    roadmap = models.ForeignKey(LearningRoadmap, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    week_number = models.PositiveIntegerField(default=1)
    day_number = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUSES, default='pending')
    priority = models.CharField(max_length=10, choices=PRIORITIES, default='medium')
    resource_url = models.URLField(blank=True)
    estimated_hours = models.FloatField(default=2)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['week_number', 'day_number', 'id']

    def __str__(self):
        return f'W{self.week_number}: {self.title}'