from django.urls import path

from .views import (
    AbandonSessionView,
    CompleteSessionView,
    PracticeGenerateView,
    PracticeListView,
    SessionDetailView,
    SessionListCreateView,
    SubmitAnswerView,
)

app_name = 'interviews'

urlpatterns = [
    path('sessions/', SessionListCreateView.as_view(), name='session_list_create'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session_detail'),
    path('sessions/<int:pk>/answer/', SubmitAnswerView.as_view(), name='submit_answer'),
    path('sessions/<int:pk>/complete/', CompleteSessionView.as_view(), name='complete_session'),
    path('sessions/<int:pk>/abandon/', AbandonSessionView.as_view(), name='abandon_session'),
    path('practice/', PracticeListView.as_view(), name='practice_list'),
    path('practice/generate/', PracticeGenerateView.as_view(), name='practice_generate'),
]