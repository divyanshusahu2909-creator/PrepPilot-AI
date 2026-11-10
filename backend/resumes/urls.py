from django.urls import path

from .views import (
    ResumeAnalysisHistoryView,
    ResumeAnalyzeView,
    ResumeDetailView,
    ResumeListView,
    ResumeQuestionsView,
    ResumeUploadView,
)

app_name = 'resumes'

urlpatterns = [
    path('', ResumeListView.as_view(), name='resume_list'),
    path('upload/', ResumeUploadView.as_view(), name='resume_upload'),
    path('analyses/', ResumeAnalysisHistoryView.as_view(), name='analysis_history'),
    path('<int:pk>/', ResumeDetailView.as_view(), name='resume_detail'),
    path('<int:pk>/analyze/', ResumeAnalyzeView.as_view(), name='resume_analyze'),
    path('<int:pk>/questions/', ResumeQuestionsView.as_view(), name='resume_questions'),
]