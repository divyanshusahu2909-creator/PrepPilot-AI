import logging

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.models import UserActivity
from ai_engine import roadmap_engine
from ai_engine.gemini import AIServiceError

from .models import LearningRoadmap, RoadmapTask
from .serializers import (
    GenerateRoadmapSerializer,
    LearningRoadmapListSerializer,
    LearningRoadmapSerializer,
    RoadmapTaskSerializer,
    UpdateTaskSerializer,
)

logger = logging.getLogger(__name__)


class RoadmapPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'


class RoadmapListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LearningRoadmapListSerializer
    pagination_class = RoadmapPagination

    def get_queryset(self):
        return LearningRoadmap.objects.filter(user=self.request.user)


class RoadmapGenerateView(APIView):
    """POST /api/roadmaps/generate/"""
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai'

    def post(self, request):
        serializer = GenerateRoadmapSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target_role = serializer.validated_data['target_role']
        weeks = serializer.validated_data['duration_weeks']
        level = getattr(getattr(request.user, 'profile', None), 'experience_level', 'fresher')

        try:
            result = roadmap_engine.generate_roadmap(target_role, weeks, level)
        except AIServiceError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        roadmap = LearningRoadmap.objects.create(
            user=request.user, target_role=target_role, duration_weeks=weeks,
            demo=result.get('demo', False),
        )
        RoadmapTask.objects.bulk_create([
            RoadmapTask(roadmap=roadmap, **task) for task in result['tasks']
        ])
        UserActivity.log(request.user, 'roadmap_generated',
                         f'Generated {weeks}-week roadmap for {target_role}', {'roadmap_id': roadmap.id})
        return Response({'roadmap': LearningRoadmapSerializer(roadmap).data}, status=status.HTTP_201_CREATED)


class RoadmapDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = LearningRoadmapSerializer

    def get_queryset(self):
        return LearningRoadmap.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        roadmap = self.get_object()
        roadmap.delete()
        return Response({'message': 'Roadmap deleted.'}, status=status.HTTP_200_OK)


class TaskUpdateView(APIView):
    """PATCH /api/roadmaps/<id>/tasks/<task_id>/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, task_id):
        roadmap = get_object_or_404(LearningRoadmap, pk=pk, user=request.user)
        task = get_object_or_404(RoadmapTask, pk=task_id, roadmap=roadmap)
        serializer = UpdateTaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task.status = serializer.validated_data['status']
        task.completed_at = timezone.now() if task.status == 'completed' else None
        task.save()
        return Response({
            'task': RoadmapTaskSerializer(task).data,
            'completion_percentage': roadmap.completion_percentage,
        })