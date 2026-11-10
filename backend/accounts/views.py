"""
Views for the accounts app.
"""

import logging
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView  # re-export
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .models import User, UserActivity
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer,
)

logger = logging.getLogger(__name__)

# Re-export TokenRefreshView for URL routing
__all__ = ['TokenRefreshView']


def get_tokens_for_user(user):
    """Generate JWT access and refresh tokens for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Register a new user and return JWT tokens.
    """
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Log activity
        UserActivity.log(user, 'login', 'Account created and logged in')

        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        logger.info(f"New user registered: {user.email}")
        return Response(
            {
                'message': 'Registration successful.',
                'user': user_data,
                'tokens': tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticate user and return JWT tokens + user data.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user).data

        # Log activity
        UserActivity.log(user, 'login', 'User logged in', {'ip': request.META.get('REMOTE_ADDR', '')})

        logger.info(f"User logged in: {user.email}")
        return Response(
            {
                'message': 'Login successful.',
                'user': user_data,
                'tokens': tokens,
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklist the refresh token to log the user out.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(f"User logged out: {request.user.email}")
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except TokenError as e:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/me/
    Returns the current authenticated user's details.
    PATCH /api/auth/me/
    Update basic user fields (first_name, last_name).
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        return UserSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        # Only allow updating first_name and last_name via this endpoint
        allowed_fields = {'first_name', 'last_name'}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Change the authenticated user's password.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        logger.info(f"Password changed for user: {request.user.email}")
        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    """
    POST /api/auth/password-reset/
    Send a password reset email to the given address.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Return success even if user doesn't exist (security best practice)
            return Response(
                {'message': 'If an account with this email exists, a password reset link has been sent.'},
                status=status.HTTP_200_OK,
            )

        # Generate password reset token
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

        # Send email
        try:
            subject = 'PrepPilot AI - Password Reset Request'
            message = (
                f"Hello {user.get_short_name()},\n\n"
                f"You requested a password reset for your PrepPilot AI account.\n\n"
                f"Click the link below to reset your password:\n{reset_url}\n\n"
                f"This link will expire in 1 hour.\n\n"
                f"If you did not request this, please ignore this email.\n\n"
                f"Best regards,\nThe PrepPilot AI Team"
            )
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            logger.info(f"Password reset email sent to: {email}")
        except Exception as e:
            logger.error(f"Failed to send password reset email to {email}: {e}")
            return Response(
                {'error': 'Failed to send password reset email. Please try again later.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {'message': 'If an account with this email exists, a password reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """
    POST /api/auth/password-reset/confirm/
    Confirm the password reset with uid and token, then set new password.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        logger.info(f"Password successfully reset for user: {user.email}")
        return Response(
            {'message': 'Password has been reset successfully. You can now log in with your new password.'},
            status=status.HTTP_200_OK,
        )


class GoogleAuthView(APIView):
    """
    POST /api/auth/google/
    Sign in with Google: verify the ID token from Google Identity Services,
    then create/fetch the user and return JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        credential = request.data.get('credential')
        if not credential:
            return Response({'error': 'Google credential is required.'}, status=status.HTTP_400_BAD_REQUEST)

        client_id = settings.GOOGLE_CLIENT_ID
        if not client_id:
            return Response(
                {'error': 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID in backend/.env.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token

        try:
            idinfo = id_token.verify_oauth2_token(credential, google_requests.Request(), client_id)
        except ValueError:
            return Response({'error': 'Invalid or expired Google credential.'}, status=status.HTTP_400_BAD_REQUEST)

        email = (idinfo.get('email') or '').lower()
        if not email or not idinfo.get('email_verified'):
            return Response({'error': 'Google account email is not verified.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            user = User.objects.create_user(
                email=email,
                password=None,
                first_name=idinfo.get('given_name', '')[:150],
                last_name=idinfo.get('family_name', '')[:150],
                email_verified=True,
            )
            logger.info(f"New user registered via Google: {email}")
        if not user.is_active:
            return Response({'error': 'Your account has been deactivated.'}, status=status.HTTP_400_BAD_REQUEST)

        tokens = get_tokens_for_user(user)
        UserActivity.log(user, 'login', 'User logged in with Google')
        return Response({
            'message': 'Login successful.',
            'user': UserSerializer(user).data,
            'tokens': tokens,
        })
