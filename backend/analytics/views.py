"""Dashboard and admin analytics — all stats computed from real user data."""

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import UserActivity
from ai_engine.gemini import ai_configured
from interviews.models import InterviewSession
from resumes.models import Resume, ResumeAnalysis
from roadmaps.models import LearningRoadmap, RoadmapTask
from voice_coach.models import VoiceSession

from .permissions import IsAdminRole

User = get_user_model()


def _round(value):
    return round(value, 1) if value is not None else None


class DashboardView(APIView):
    """GET /api/analytics/dashboard/ — everything the student dashboard shows."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        interviews = InterviewSession.objects.filter(user=user)
        completed = interviews.filter(status='completed')
        voice_completed = VoiceSession.objects.filter(user=user, status='completed', report__isnull=False)

        total_interviews = completed.count()
        avg_score = _round(completed.aggregate(a=Avg('overall_score'))['a'])
        communication_score = _round(voice_completed.aggregate(a=Avg('report__overall_score'))['a'])

        latest_analysis = ResumeAnalysis.objects.filter(resume__user=user).order_by('-analyzed_at').first()
        resume_score = latest_analysis.overall_score if latest_analysis else None

        # Score trend: last 14 days
        weekly_scores = []
        for i in range(13, -1, -1):
            day = (now - timedelta(days=i)).date()
            day_interviews = completed.filter(completed_at__date=day)
            day_voice = voice_completed.filter(ended_at__date=day)
            weekly_scores.append({
                'date': day.isoformat(),
                'interview_score': _round(day_interviews.aggregate(a=Avg('overall_score'))['a']),
                'voice_score': _round(day_voice.aggregate(a=Avg('report__overall_score'))['a']),
            })

        recent_interviews = [
            {
                'id': s.id, 'role': s.role, 'interview_type': s.interview_type,
                'difficulty': s.difficulty, 'overall_score': _round(s.overall_score),
                'status': s.status, 'started_at': s.started_at.isoformat(),
                'duration_seconds': s.duration_seconds,
            }
            for s in interviews[:5]
        ]

        recent_activities = [
            {
                'id': a.id, 'activity_type': a.activity_type,
                'description': a.description, 'created_at': a.created_at.isoformat(),
            }
            for a in UserActivity.objects.filter(user=user)[:8]
        ]

        # Streak: consecutive days with a completed interview, counting back from today
        streak = 0
        day = now.date()
        completed_dates = set(completed.filter(completed_at__isnull=False).dates('completed_at', 'day'))
        if day not in completed_dates:
            day -= timedelta(days=1)
        while day in completed_dates:
            streak += 1
            day -= timedelta(days=1)

        # Daily goals (real progress from today's data)
        interviews_today = completed.filter(completed_at__gte=today_start).count()
        voice_minutes_today = round(
            (VoiceSession.objects.filter(user=user, started_at__gte=today_start)
             .aggregate(total=Sum('duration_seconds'))['total'] or 0) / 60
        )
        tasks_today = RoadmapTask.objects.filter(
            roadmap__user=user, status='completed', completed_at__gte=today_start,
        ).count()
        daily_goals = [
            {'id': 'interview', 'title': 'Complete a mock interview', 'type': 'interview',
             'target': 1, 'progress': min(interviews_today, 1), 'completed': interviews_today >= 1},
            {'id': 'voice', 'title': 'Practice speaking for 10 minutes', 'type': 'voice',
             'target': 10, 'progress': min(voice_minutes_today, 10), 'completed': voice_minutes_today >= 10},
            {'id': 'roadmap', 'title': 'Finish 2 roadmap tasks', 'type': 'study',
             'target': 2, 'progress': min(tasks_today, 2), 'completed': tasks_today >= 2},
        ]

        latest_roadmap = LearningRoadmap.objects.filter(user=user).first()
        learning_progress = latest_roadmap.completion_percentage if latest_roadmap else None

        # Rule-based recommendations from the user's actual weakest areas
        recommendations = []
        if resume_score is None:
            recommendations.append({
                'title': 'Analyze your resume', 'type': 'resume', 'link': '/resume',
                'description': 'Upload your PDF resume to get an ATS score and tailored improvements.',
                'priority': 'high', 'estimated_minutes': 5,
            })
        elif resume_score < 70:
            recommendations.append({
                'title': 'Improve your resume', 'type': 'resume', 'link': '/resume',
                'description': f'Your resume scored {resume_score}/100 — apply the suggested fixes and re-analyze.',
                'priority': 'high', 'estimated_minutes': 20,
            })
        if total_interviews == 0:
            recommendations.append({
                'title': 'Take your first mock interview', 'type': 'interview', 'link': '/interview',
                'description': 'Start with a beginner HR round to build confidence.',
                'priority': 'high', 'estimated_minutes': 15,
            })
        elif avg_score is not None and avg_score < 70:
            recommendations.append({
                'title': 'Practice a technical round', 'type': 'interview', 'link': '/interview',
                'description': f'Your average is {avg_score}/100. Focus on depth and concrete examples.',
                'priority': 'medium', 'estimated_minutes': 20,
            })
        if communication_score is None or communication_score < 70:
            recommendations.append({
                'title': 'Train with the Voice Coach', 'type': 'voice', 'link': '/voice',
                'description': 'A 10-minute speaking session improves fluency and confidence fast.',
                'priority': 'medium', 'estimated_minutes': 10,
            })
        if latest_roadmap is None:
            recommendations.append({
                'title': 'Generate a learning roadmap', 'type': 'study', 'link': '/roadmap',
                'description': 'Get a week-by-week plan tailored to your target role.',
                'priority': 'medium', 'estimated_minutes': 5,
            })
        if not recommendations:
            recommendations.append({
                'title': 'Challenge yourself', 'type': 'interview', 'link': '/interview',
                'description': 'Try an advanced interview or a company-specific round.',
                'priority': 'low', 'estimated_minutes': 25,
            })

        return Response({
            'total_interviews': total_interviews,
            'avg_interview_score': avg_score,
            'communication_score': communication_score,
            'resume_score': resume_score,
            'total_voice_sessions': voice_completed.count(),
            'weekly_scores': weekly_scores,
            'recent_interviews': recent_interviews,
            'recent_activities': recent_activities,
            'recommendations': recommendations[:4],
            'daily_goals': daily_goals,
            'interview_streak': streak,
            'learning_progress': learning_progress,
            'ai_configured': ai_configured(),
        })


class AdminStatsView(APIView):
    """GET /api/analytics/admin/ — platform-wide stats (admin only)."""
    permission_classes = [IsAdminRole]

    def get(self, request):
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        signups_per_day = []
        for i in range(13, -1, -1):
            day = (now - timedelta(days=i)).date()
            signups_per_day.append({
                'date': day.isoformat(),
                'count': User.objects.filter(date_joined__date=day).count(),
            })

        return Response({
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(last_login__gte=month_ago).count(),
            'new_users_7d': User.objects.filter(date_joined__gte=week_ago).count(),
            'total_interviews': InterviewSession.objects.count(),
            'completed_interviews': InterviewSession.objects.filter(status='completed').count(),
            'total_voice_sessions': VoiceSession.objects.count(),
            'total_resumes': Resume.objects.count(),
            'avg_interview_score': _round(InterviewSession.objects.filter(status='completed')
                                        .aggregate(a=Avg('overall_score'))['a']),
            'signups_per_day': signups_per_day,
            'recent_activities': [
                {'id': a.id, 'user': a.user.email, 'activity_type': a.activity_type,
                 'description': a.description, 'created_at': a.created_at.isoformat()}
                for a in UserActivity.objects.select_related('user')[:15]
            ],
            'ai_configured': ai_configured(),
        })


class AdminUserListView(APIView):
    """GET /api/analytics/admin/users/?search=&page="""
    permission_classes = [IsAdminRole]

    def get(self, request):
        qs = User.objects.annotate(
            interview_count=Count('interview_sessions', distinct=True),
            voice_count=Count('voice_sessions', distinct=True),
        ).order_by('-date_joined')
        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(Q(email__icontains=search) | Q(first_name__icontains=search) |
                           Q(last_name__icontains=search))
        paginator = PageNumberPagination()
        paginator.page_size = 15
        page = paginator.paginate_queryset(qs, request)
        data = [
            {
                'id': u.id, 'email': u.email, 'first_name': u.first_name, 'last_name': u.last_name,
                'role': u.role, 'is_active': u.is_active, 'date_joined': u.date_joined.isoformat(),
                'last_login': u.last_login.isoformat() if u.last_login else None,
                'interview_count': u.interview_count, 'voice_count': u.voice_count,
            }
            for u in page
        ]
        return paginator.get_paginated_response(data)


class AdminUserUpdateView(APIView):
    """PATCH /api/analytics/admin/users/<id>/ — activate/deactivate or change role."""
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        if user.pk == request.user.pk:
            return Response({'error': 'You cannot modify your own account here.'}, status=status.HTTP_400_BAD_REQUEST)

        if 'is_active' in request.data:
            user.is_active = bool(request.data['is_active'])
        if 'role' in request.data:
            if request.data['role'] not in ('user', 'admin'):
                return Response({'error': 'Role must be user or admin.'}, status=status.HTTP_400_BAD_REQUEST)
            user.role = request.data['role']
            user.is_staff = request.data['role'] == 'admin'
        user.save()
        return Response({
            'id': user.id, 'email': user.email, 'role': user.role, 'is_active': user.is_active,
        })