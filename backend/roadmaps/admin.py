from django.contrib import admin

from .models import LearningRoadmap, RoadmapTask


@admin.register(LearningRoadmap)
class LearningRoadmapAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'target_role', 'duration_weeks', 'created_at']
    search_fields = ['user__email', 'target_role']


@admin.register(RoadmapTask)
class RoadmapTaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'roadmap', 'title', 'week_number', 'status', 'priority']
    list_filter = ['status', 'priority']