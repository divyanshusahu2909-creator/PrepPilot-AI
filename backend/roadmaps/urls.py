from django.urls import path

from .views import RoadmapDetailView, RoadmapGenerateView, RoadmapListView, TaskUpdateView

app_name = 'roadmaps'

urlpatterns = [
    path('', RoadmapListView.as_view(), name='roadmap_list'),
    path('generate/', RoadmapGenerateView.as_view(), name='roadmap_generate'),
    path('<int:pk>/', RoadmapDetailView.as_view(), name='roadmap_detail'),
    path('<int:pk>/tasks/<int:task_id>/', TaskUpdateView.as_view(), name='task_update'),
]