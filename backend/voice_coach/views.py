import logging
import re

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.models import UserActivity
from ai_engine import voice_engine
from ai_engine.gemini import AIServiceError

from .models import CommunicationReport, VoiceMessage, VoiceSession
from .serializers import (
    CommunicationReportSerializer,
    StartVoiceSessionSerializer,
    VoiceMessageInputSerializer,
    VoiceMessageSerializer,
    VoiceSessionListSerializer,
    VoiceSessionSerializer,
)

logger = logging.getLogger(__name__)

FILLER_PATTERN = re.compile(
    r'\b(um|uh|er|ah|basically|actually|literally|you know)\b', re.IGNORECASE
)


class VoicePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


def ai_error_response(exc):
    return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class SessionListCreateView(APIView):
    """GET /api/voice/sessions/ | POST /api/voice/sessions/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = VoiceSession.objects.filter(user=request.user)
        paginator = VoicePagination()
        page = paginator.paginate_queryset(sessions, request)
        return paginator.get_paginated_response(VoiceSessionListSerializer(page, many=True).data)

    def post(self, request):
        serializer = StartVoiceSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mode = serializer.validated_data['mode']
        topic = serializer.validated_data.get('topic', '')

        try:
            opening = voice_engine.opening_message(mode, topic)
        except AIServiceError as exc:
            return ai_error_response(exc)

        session = VoiceSession.objects.create(
            user=request.user, mode=mode, topic=topic, demo=opening.get('demo', False),
        )
        VoiceMessage.objects.create(session=session, speaker='ai', text=opening['reply'])
        UserActivity.log(request.user, 'voice_session', f'Started voice session ({mode})',
                         {'session_id': session.id})
        return Response({'session': VoiceSessionSerializer(session).data}, status=status.HTTP_201_CREATED)


class SessionDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = VoiceSessionSerializer

    def get_queryset(self):
        return VoiceSession.objects.filter(user=self.request.user)


class SendMessageView(APIView):
    """POST /api/voice/sessions/<id>/message/ — user speaks; coach replies."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai'

    def post(self, request, pk):
        session = get_object_or_404(VoiceSession, pk=pk, user=request.user)
        if session.status != 'active':
            return Response({'error': 'This session is no longer active.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VoiceMessageInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        text = serializer.validated_data['text'].strip()
        client_metrics = serializer.validated_data.get('metrics', {})

        words = len(text.split())
        duration = float(client_metrics.get('duration_seconds') or 0)
        metrics = {
            'word_count': words,
            'duration_seconds': round(duration, 1),
            'wpm': round(words / duration * 60, 1) if duration > 0 else None,
            'filler_count': len(FILLER_PATTERN.findall(text)),
            'stt_confidence': client_metrics.get('stt_confidence'),
        }

        history = [{'speaker': m.speaker, 'text': m.text} for m in session.messages.all()]
        try:
            result = voice_engine.reply(session.mode, session.topic, history, text)
        except AIServiceError as exc:
            return ai_error_response(exc)

        user_message = VoiceMessage.objects.create(
            session=session, speaker='user', text=text, metrics=metrics,
            feedback={'grammar_corrections': result['grammar_corrections'], 'fluency_note': result['fluency_note']},
        )
        ai_message = VoiceMessage.objects.create(session=session, speaker='ai', text=result['reply'])

        return Response({
            'user_message': VoiceMessageSerializer(user_message).data,
            'ai_message': VoiceMessageSerializer(ai_message).data,
        })


class CompleteSessionView(APIView):
    """POST /api/voice/sessions/<id>/complete/ — full communication report."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai'

    def post(self, request, pk):
        session = get_object_or_404(VoiceSession, pk=pk, user=request.user)
        if session.status == 'completed' and hasattr(session, 'report'):
            return Response({'session': VoiceSessionSerializer(session).data})
        if session.status != 'active':
            return Response({'error': 'This session cannot be completed.'}, status=status.HTTP_400_BAD_REQUEST)

        messages = list(session.messages.all())
        user_messages = [m for m in messages if m.speaker == 'user']
        if not user_messages:
            return Response({'error': 'Speak at least once before finishing.'}, status=status.HTTP_400_BAD_REQUEST)

        durations = [m.metrics.get('duration_seconds') or 0 for m in user_messages]
        wpms = [m.metrics['wpm'] for m in user_messages if m.metrics.get('wpm')]
        confidences = [m.metrics['stt_confidence'] for m in user_messages
                       if isinstance(m.metrics.get('stt_confidence'), (int, float))]
        metrics = {
            'total_duration_seconds': sum(durations),
            'avg_wpm': round(sum(wpms) / len(wpms), 1) if wpms else None,
            'total_fillers': sum(m.metrics.get('filler_count', 0) for m in user_messages),
            'avg_stt_confidence': round(sum(confidences) / len(confidences), 2) if confidences else None,
            'user_turns': len(user_messages),
        }

        try:
            report_data = voice_engine.communication_report(
                [{'speaker': m.speaker, 'text': m.text} for m in messages], metrics,
            )
        except AIServiceError as exc:
            return ai_error_response(exc)

        report_data.pop('demo', None)
        report = CommunicationReport.objects.create(session=session, **report_data)
        now = timezone.now()
        session.status = 'completed'
        session.ended_at = now
        session.duration_seconds = min(86400, int((now - session.started_at).total_seconds()))
        session.save()

        UserActivity.log(request.user, 'voice_session',
                         f'Completed voice session — {report.overall_score}/100',
                         {'session_id': session.id, 'score': report.overall_score})
        return Response({
            'session': VoiceSessionSerializer(session).data,
            'report': CommunicationReportSerializer(report).data,
        })


class AbandonSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        session = get_object_or_404(VoiceSession, pk=pk, user=request.user)
        if session.status == 'active':
            session.status = 'abandoned'
            session.ended_at = timezone.now()
            session.duration_seconds = min(86400, int((session.ended_at - session.started_at).total_seconds()))
            session.save()
        return Response({'session': VoiceSessionSerializer(session).data})


class DailyExercisesView(APIView):
    """GET /api/voice/exercises/ — today's exercise + random speaking topics."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(voice_engine.daily_exercises())