"""
Serializers for the resumes app.
"""

from rest_framework import serializers
from .models import Resume, ResumeAnalysis


class ResumeSerializer(serializers.ModelSerializer):
    """Serializer for Resume model."""

    file_size_mb = serializers.ReadOnlyField()
    file_url = serializers.SerializerMethodField()
    has_analysis = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id',
            'filename',
            'file_url',
            'file_size',
            'file_size_mb',
            'is_active',
            'uploaded_at',
            'has_analysis',
        ]
        read_only_fields = ['id', 'filename', 'file_size', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None

    def get_has_analysis(self, obj):
        return obj.analyses.exists()


class ResumeUploadSerializer(serializers.Serializer):
    """Serializer for resume file upload."""

    file = serializers.FileField()


class ResumeAnalysisSerializer(serializers.ModelSerializer):
    """Serializer for ResumeAnalysis model."""

    resume_filename = serializers.CharField(source='resume.filename', read_only=True)
    resume_id = serializers.IntegerField(source='resume.id', read_only=True)
    demo = serializers.SerializerMethodField()

    class Meta:
        model = ResumeAnalysis
        fields = [
            'id',
            'resume_id',
            'resume_filename',
            'overall_score',
            'ats_score',
            'ats_disclaimer',
            'skills_found',
            'missing_skills',
            'education_feedback',
            'experience_feedback',
            'grammar_issues',
            'formatting_issues',
            'improvements',
            'improved_summary',
            'strengths',
            'weaknesses',
            'demo',
            'analyzed_at',
        ]
        read_only_fields = fields

    def get_demo(self, obj):
        return bool(obj.raw_analysis.get('demo', False))


class ResumeWithAnalysisSerializer(serializers.ModelSerializer):
    """Serializer combining Resume and its latest analysis."""

    file_size_mb = serializers.ReadOnlyField()
    file_url = serializers.SerializerMethodField()
    latest_analysis = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = [
            'id',
            'filename',
            'file_url',
            'file_size',
            'file_size_mb',
            'is_active',
            'uploaded_at',
            'latest_analysis',
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None

    def get_latest_analysis(self, obj):
        analysis = obj.analyses.order_by('-analyzed_at').first()
        if analysis:
            return ResumeAnalysisSerializer(analysis).data
        return None
