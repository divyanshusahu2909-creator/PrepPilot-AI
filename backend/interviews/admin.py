from django.contrib import admin

from .models import InterviewAnswer, InterviewQuestion, InterviewSession, PracticeQuestion


@admin.register(InterviewSession)
class InterviewSessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'interview_type', 'difficulty', 'role', 'status', 'overall_score', 'started_at']
    list_filter = ['interview_type', 'difficulty', 'status']
    search_fields = ['user__email', 'role', 'company']


@admin.register(InterviewQuestion)
class InterviewQuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'order_index', 'category']
    search_fields = ['text']


@admin.register(InterviewAnswer)
class InterviewAnswerAdmin(admin.ModelAdmin):
    list_display = ['id', 'question', 'overall_score', 'created_at']


@admin.register(PracticeQuestion)
class PracticeQuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'category', 'difficulty', 'created_at']
    list_filter = ['category', 'difficulty']
    search_fields = ['question', 'user__email']