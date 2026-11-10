"""
Serializers for the profiles app.
"""

from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for the UserProfile model."""

    skills_list = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'id',
            'avatar',
            'avatar_url',
            'bio',
            'phone',
            'target_role',
            'experience_level',
            'skills',
            'skills_list',
            'linkedin_url',
            'github_url',
            'portfolio_url',
            'location',
            'college',
            'graduation_year',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_skills_list(self, obj):
        return obj.get_skills_list()

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def validate_graduation_year(self, value):
        if value is not None and (value < 1950 or value > 2100):
            raise serializers.ValidationError('Please enter a valid graduation year.')
        return value

    def validate_skills(self, value):
        """Accept skills as either a comma-separated string or JSON array string."""
        return value


class UserProfileDetailSerializer(serializers.Serializer):
    """Combined serializer returning user + profile data together."""

    user = UserSerializer(read_only=True)
    profile = serializers.SerializerMethodField()

    def get_profile(self, obj):
        try:
            profile = obj.profile
        except UserProfile.DoesNotExist:
            return None
        return UserProfileSerializer(profile, context=self.context).data
