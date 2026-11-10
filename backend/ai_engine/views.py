from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .gemini import ai_configured, demo_mode_enabled


class ServiceStatusView(APIView):
    """GET /api/config/ — public service configuration status for the UI."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({
            'ai_configured': ai_configured(),
            'demo_mode': demo_mode_enabled(),
            'google_oauth_configured': bool(settings.GOOGLE_CLIENT_ID),
            'google_client_id': settings.GOOGLE_CLIENT_ID,
            'max_upload_size_mb': settings.MAX_UPLOAD_SIZE // (1024 * 1024),
        })