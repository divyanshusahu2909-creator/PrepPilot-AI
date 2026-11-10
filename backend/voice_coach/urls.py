from django.urls import path

from .views import (
    AbandonSessionView,
    CompleteSessionView,
    DailyExercisesView,
    SendMessageView,
    SessionDetailView,
    SessionListCreateView,
)

app_name = 'voice_coach'

urlpatterns = [
    path('sessions/', SessionListCreateView.as_view(), name='session_list_create'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session_detail'),
    path('sessions/<int:pk>/message/', SendMessageView.as_view(), name='send_message'),
    path('sessions/<int:pk>/complete/', CompleteSessionView.as_view(), name='complete_session'),
    path('sessions/<int:pk>/abandon/', AbandonSessionView.as_view(), name='abandon_session'),
    path('exercises/', DailyExercisesView.as_view(), name='daily_exercises'),
]