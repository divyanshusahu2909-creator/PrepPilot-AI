from rest_framework import serializers

from .models import CommunicationReport, VoiceMessage, VoiceSession


class VoiceMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceMessage
        fields = ['id', 'speaker', 'text', 'metrics', 'feedback', 'created_at']
        read_only_fields = fields


class CommunicationReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommunicationReport
        fields = [
            'id', 'fluency_score', 'grammar_score', 'pronunciation_score',
            'confidence_score', 'vocabulary_score', 'overall_score',
            'strengths', 'improvements', 'grammar_corrections', 'detailed_feedback', 'created_at',
        ]
        read_only_fields = fields


class VoiceSessionSerializer(serializers.ModelSerializer):
    messages = VoiceMessageSerializer(many=True, read_only=True)
    report = CommunicationReportSerializer(read_only=True)

    class Meta:
        model = VoiceSession
        fields = [
            'id', 'mode', 'topic', 'status', 'demo', 'started_at', 'ended_at',
            'duration_seconds', 'messages', 'report',
        ]
        read_only_fields = fields


class VoiceSessionListSerializer(serializers.ModelSerializer):
    message_count = serializers.IntegerField(source='messages.count', read_only=True)
    overall_score = serializers.FloatField(source='report.overall_score', read_only=True, default=None)

    class Meta:
        model = VoiceSession
        fields = [
            'id', 'mode', 'topic', 'status', 'demo', 'started_at', 'ended_at',
            'duration_seconds', 'message_count', 'overall_score',
        ]
        read_only_fields = fields


class StartVoiceSessionSerializer(serializers.Serializer):
    mode = serializers.ChoiceField(choices=VoiceSession.MODES, default='conversation')
    topic = serializers.CharField(max_length=500, required=False, allow_blank=True, default='')


class VoiceMessageInputSerializer(serializers.Serializer):
    text = serializers.CharField(min_length=1, max_length=8000)
    metrics = serializers.DictField(required=False, default=dict)