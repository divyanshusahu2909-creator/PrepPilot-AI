import logging

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from accounts.models import UserActivity
from ai_engine import interview_engine, practice_engine
from ai_engine.gemini import AIServiceError
from resumes.models import Resume

from .models import InterviewAnswer, InterviewQuestion, InterviewSession, PracticeQuestion
from .serializers import (
    GeneratePracticeSerializer,
    InterviewQuestionSerializer,
    InterviewSessionListSerializer,
    InterviewSessionSerializer,
    PracticeQuestionSerializer,
    StartInterviewSerializer,
    SubmitAnswerSerializer,
)

logger = logging.getLogger(__name__)


class StandardPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


def session_config(session: InterviewSession) -> dict:
    return {
        'interview_type': session.interview_type,
        'difficulty': session.difficulty,
        'role': session.role,
        'company': session.company,
        'resume_text': session.resume.extracted_text if session.resume else '',
    }


def session_history(session: InterviewSession) -> list:
    history = []
    for question in session.questions.select_related('answer').all():
        if hasattr(question, 'answer'):
            history.append({
                'question': question.text,
                'answer': question.answer.text,
                'score': question.answer.overall_score,
            })
    return history


def ai_error_response(exc: AIServiceError) -> Response:
    return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class SessionListCreateView(APIView):
    """GET /api/interviews/sessions/ | POST /api/interviews/sessions/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = InterviewSession.objects.filter(user=request.user)
        paginator = StandardPagination()
        page = paginator.paginate_queryset(sessions, request)
        serializer = InterviewSessionListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = StartInterviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        role = data.get('role') or ''
        if not role:
            profile = getattr(request.user, 'profile', None)
            role = (profile.target_role if profile else '') or 'Software Engineer'

        resume = None
        if data.get('resume_id'):
            resume = get_object_or_404(Resume, pk=data['resume_id'], user=request.user)

        with transaction.atomic():
            session = InterviewSession.objects.create(
                user=request.user,
                interview_type=data['interview_type'],
                difficulty=data['difficulty'],
                role=role,
                company=data.get('company', ''),
                resume=resume,
                total_questions=data['total_questions'],
            )
            try:
                first = interview_engine.generate_question(session_config(session), [], 1, session.total_questions)
            except AIServiceError as exc:
                transaction.set_rollback(True)
                return ai_error_response(exc)
            session.demo = first.get('demo', False)
            session.save(update_fields=['demo'])
            InterviewQuestion.objects.create(
                session=session, text=first['question'], category=first['category'],
                order_index=0, ideal_answer=first['ideal_answer'], keywords=first['keywords'],
            )

        UserActivity.log(request.user, 'interview_started',
                         f'Started {session.interview_type} interview for {session.role}',
                         {'session_id': session.id})
        return Response(
            {'session': InterviewSessionSerializer(session).data},
            status=status.HTTP_201_CREATED,
        )


class SessionDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = InterviewSessionSerializer

    def get_queryset(self):
        return InterviewSession.objects.filter(user=self.request.user)


class SubmitAnswerView(APIView):
    """POST /api/interviews/sessions/<id>/answer/ — evaluate, then ask the next question."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai'

    def post(self, request, pk):
        session = get_object_or_404(InterviewSession, pk=pk, user=request.user)
        if session.status != 'in_progress':
            return Response({'error': 'This interview is no longer in progress.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = SubmitAnswerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        question = session.questions.filter(order_index=session.current_question_index).first()
        if question is None:
            return Response({'error': 'No active question. Complete the interview instead.'}, status=status.HTTP_400_BAD_REQUEST)
        if hasattr(question, 'answer'):
            return Response({'error': 'This question has already been answered.'}, status=status.HTTP_400_BAD_REQUEST)

        config = session_config(session)
        try:
            evaluation = interview_engine.evaluate_answer(
                question.text, serializer.validated_data['answer_text'], config,
                question.keywords, question.ideal_answer,
            )
        except AIServiceError as exc:
            return ai_error_response(exc)

        answer = InterviewAnswer.objects.create(
            question=question,
            text=serializer.validated_data['answer_text'],
            time_taken_seconds=serializer.validated_data['time_taken_seconds'],
            relevance_score=evaluation['relevance_score'],
            clarity_score=evaluation['clarity_score'],
            depth_score=evaluation['depth_score'],
            overall_score=evaluation['overall_score'],
            feedback=evaluation['feedback'],
            suggested_answer=evaluation['suggested_answer'],
        )

        next_question = None
        is_last = session.answered_count >= session.total_questions
        if not is_last:
            try:
                generated = interview_engine.generate_question(
                    config, session_history(session),
                    session.current_question_index + 2, session.total_questions,
                )
            except AIServiceError as exc:
                return ai_error_response(exc)
            next_question = InterviewQuestion.objects.create(
                session=session, text=generated['question'], category=generated['category'],
                order_index=session.current_question_index + 1,
                ideal_answer=generated['ideal_answer'], keywords=generated['keywords'],
            )
            session.current_question_index += 1
            session.save(update_fields=['current_question_index'])

        return Response({
            'evaluation': {
                'id': answer.id,
                'relevance_score': answer.relevance_score,
                'clarity_score': answer.clarity_score,
                'depth_score': answer.depth_score,
                'overall_score': answer.overall_score,
                'feedback': answer.feedback,
                'suggested_answer': answer.suggested_answer,
            },
            'next_question': InterviewQuestionSerializer(next_question).data if next_question else None,
            'is_last': is_last,
            'session': InterviewSessionSerializer(session).data,
        })


class CompleteSessionView(APIView):
    """POST /api/interviews/sessions/<id>/complete/ — generate the final report."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai'

    def post(self, request, pk):
        session = get_object_or_404(InterviewSession, pk=pk, user=request.user)
        if session.status == 'completed':
            return Response({'session': InterviewSessionSerializer(session).data})
        if session.status != 'in_progress':
            return Response({'error': 'This interview cannot be completed.'}, status=status.HTTP_400_BAD_REQUEST)

        qa_pairs = []
        for question in session.questions.select_related('answer').all():
            if hasattr(question, 'answer'):
                a = question.answer
                qa_pairs.append({
                    'question': question.text, 'answer': a.text,
                    'relevance_score': a.relevance_score, 'clarity_score': a.clarity_score,
                    'depth_score': a.depth_score, 'overall_score': a.overall_score,
                })
        if not qa_pairs:
            return Response({'error': 'Answer at least one question before completing.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            report = interview_engine.generate_report(session_config(session), qa_pairs)
        except AIServiceError as exc:
            return ai_error_response(exc)

        now = timezone.now()
        session.status = 'completed'
        session.completed_at = now
        session.overall_score = report['overall_score']
        session.report = report
        session.duration_seconds = min(86400, int((now - session.started_at).total_seconds()))
        session.demo = report.get('demo', session.demo)
        session.save()

        UserActivity.log(request.user, 'interview_completed',
                         f'Completed {session.interview_type} interview — {session.overall_score}/100',
                         {'session_id': session.id, 'score': session.overall_score})
        return Response({'session': InterviewSessionSerializer(session).data})


class AbandonSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        session = get_object_or_404(InterviewSession, pk=pk, user=request.user)
        if session.status == 'in_progress':
            session.status = 'abandoned'
            session.completed_at = timezone.now()
            session.duration_seconds = min(86400, int((session.completed_at - session.started_at).total_seconds()))
            session.save()
        return Response({'session': InterviewSessionSerializer(session).data})


class PracticeListView(generics.ListAPIView):
    """GET /api/interviews/practice/ — the user's saved practice questions."""
    permission_classes = [IsAuthenticated]
    serializer_class = PracticeQuestionSerializer
    pagination_class = StandardPagination

    def get_queryset(self):
        qs = PracticeQuestion.objects.filter(user=self.request.user)
        category = self.request.query_params.get('category')
        difficulty = self.request.query_params.get('difficulty')
        if category:
            qs = qs.filter(category=category)
        if difficulty:
            qs = qs.filter(difficulty=difficulty)
        return qs


class PracticeGenerateView(APIView):
    """POST /api/interviews/practice/generate/ — generate and save a question set."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai'

    def post(self, request):
        serializer = GeneratePracticeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        role = data.get('role') or getattr(getattr(request.user, 'profile', None), 'target_role', '') or 'Software Engineer'

        try:
            result = practice_engine.generate_questions(data['category'], data['difficulty'], role, data['count'])
        except AIServiceError as exc:
            return ai_error_response(exc)

        questions = PracticeQuestion.objects.bulk_create([
            PracticeQuestion(
                user=request.user, question=q['question'], category=q['category'],
                difficulty=data['difficulty'], role=role,
                ideal_answer=q['ideal_answer'], keywords=q['keywords'],
            )
            for q in result['questions']
        ])
        return Response({
            'questions': PracticeQuestionSerializer(questions, many=True).data,
            'demo': result.get('demo', False),
        }, status=status.HTTP_201_CREATED)