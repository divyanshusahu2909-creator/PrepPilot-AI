"""
URL configuration for PrepPilot AI backend.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from ai_engine.views import ServiceStatusView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/config/', ServiceStatusView.as_view(), name='service_status'),
    path('api/auth/', include('accounts.urls')),
    path('api/profile/', include('profiles.urls')),
    path('api/resumes/', include('resumes.urls')),
    path('api/interviews/', include('interviews.urls')),
    path('api/voice/', include('voice_coach.urls')),
    path('api/roadmaps/', include('roadmaps.urls')),
    path('api/analytics/', include('analytics.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
