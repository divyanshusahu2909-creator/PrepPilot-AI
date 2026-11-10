from rest_framework import serializers

from .models import LearningRoadmap, RoadmapTask


class RoadmapTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapTask
        fields = [
            'id', 'title', 'description', 'week_number', 'day_number', 'status',
            'priority', 'resource_url', 'estimated_hours', 'completed_at',
        ]
        read_only_fields = ['id', 'title', 'description', 'week_number', 'day_number',
                            'priority', 'resource_url', 'estimated_hours', 'completed_at']


class LearningRoadmapSerializer(serializers.ModelSerializer):
    tasks = RoadmapTaskSerializer(many=True, read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)

    class Meta:
        model = LearningRoadmap
        fields = ['id', 'target_role', 'duration_weeks', 'demo', 'created_at', 'completion_percentage', 'tasks']
        read_only_fields = fields


class LearningRoadmapListSerializer(serializers.ModelSerializer):
    completion_percentage = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(source='tasks.count', read_only=True)

    class Meta:
        model = LearningRoadmap
        fields = ['id', 'target_role', 'duration_weeks', 'demo', 'created_at', 'completion_percentage', 'task_count']
        read_only_fields = fields


class GenerateRoadmapSerializer(serializers.Serializer):
    target_role = serializers.CharField(max_length=200)
    duration_weeks = serializers.IntegerField(min_value=1, max_value=24, default=8)


class UpdateTaskSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=RoadmapTask.STATUSES)