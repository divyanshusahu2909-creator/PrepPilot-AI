"""
Views for the profiles app.
"""

import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings

from .models import UserProfile
from .serializers import UserProfileSerializer, UserProfileDetailSerializer
from accounts.serializers import UserSerializer

logger = logging.getLogger(__name__)


class ProfileView(APIView):
    """
    GET /api/profile/   → Return current user's profile + user data.
    PUT /api/profile/   → Replace entire profile.
    PATCH /api/profile/ → Partial update profile fields + optional avatar upload.
    """
    permission_classes = [IsAuthenticated]

    def _get_or_create_profile(self, user):
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return profile

    def get(self, request, *args, **kwargs):
        profile = self._get_or_create_profile(request.user)
        data = {
            'user': UserSerializer(request.user, context={'request': request}).data,
            'profile': UserProfileSerializer(profile, context={'request': request}).data,
        }
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request, *args, **kwargs):
        return self._update(request, partial=False)

    def patch(self, request, *args, **kwargs):
        return self._update(request, partial=True)

    def _update(self, request, partial=True):
        profile = self._get_or_create_profile(request.user)

        # Handle avatar upload size validation
        if 'avatar' in request.FILES:
            avatar = request.FILES['avatar']
            if avatar.size > settings.MAX_UPLOAD_SIZE:
                return Response(
                    {'error': f'Avatar file size must not exceed {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Validate image content type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if avatar.content_type not in allowed_types:
                return Response(
                    {'error': 'Avatar must be a JPEG, PNG, GIF, or WebP image.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Separate user fields from profile fields
        user_fields = {}
        profile_data = {}
        user_allowed = {'first_name', 'last_name'}

        for key, value in request.data.items():
            if key in user_allowed:
                user_fields[key] = value
            else:
                profile_data[key] = value

        # Handle file separately
        if 'avatar' in request.FILES:
            profile_data['avatar'] = request.FILES['avatar']

        # Update user fields if any
        if user_fields:
            user_serializer = UserSerializer(request.user, data=user_fields, partial=True)
            user_serializer.is_valid(raise_exception=True)
            user_serializer.save()

        # Update profile
        serializer = UserProfileSerializer(
            profile,
            data=profile_data,
            partial=partial,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        logger.info(f"Profile updated for user: {request.user.email}")
        response_data = {
            'user': UserSerializer(request.user, context={'request': request}).data,
            'profile': serializer.data,
        }
        return Response(response_data, status=status.HTTP_200_OK)
