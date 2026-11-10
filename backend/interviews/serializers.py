from rest_framework import serializers

from .models import InterviewAnswer, InterviewQuestion, InterviewSession, PracticeQuestion


class InterviewAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = InterviewAnswer
        fields = [
            'id', 'text', 'time_taken_seconds', 'relevance_score', 'clarity_score',
            'depth_score', 'overall_score', 'feedback', 'suggested_answer', 'created_at',
        ]
        read_only_fields = fields


class InterviewQuestionSerializer(serializers.ModelSerializer):
    answer = InterviewAnswerSerializer(read_only=True)
    ideal_answer = serializers.SerializerMethodField()
    keywords = serializers.SerializerMethodField()

    class Meta:
        model = InterviewQuestion
        fields = ['id', 'text', 'category', 'order_index', 'ideal_answer', 'keywords', 'answer']

    def _revealed(self, obj):
        # Model answers stay hidden until the candidate has answered (or the session ended).
        return hasattr(obj, 'answer') or obj.session.status != 'in_progress'

    def get_ideal_answer(self, obj):
        return obj.ideal_answer if self._revealed(obj) else ''

    def get_keywords(self, obj):
        return obj.keywords if self._revealed(obj) else []


class InterviewSessionSerializer(serializers.ModelSerializer):
    questions = InterviewQuestionSerializer(many=True, read_only=True)
    answered_count = serializers.IntegerField(read_only=True)
    resume_id = serializers.IntegerField(source='resume.id', read_only=True, default=None)

    class Meta:
        model = InterviewSession
        fields = [
            'id', 'interview_type', 'difficulty', 'role', 'company', 'resume_id', 'status',
            'total_questions', 'current_question_index', 'answered_count', 'overall_score',
            'report', 'demo', 'started_at', 'completed_at', 'duration_seconds', 'questions',
        ]
        read_only_fields = fields


class InterviewSessionListSerializer(serializers.ModelSerializer):
    answered_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = InterviewSession
        fields = [
            'id', 'interview_type', 'difficulty', 'role', 'company', 'status',
            'total_questions', 'answered_count', 'overall_score', 'demo',
            'started_at', 'completed_at', 'duration_seconds',
        ]
        read_only_fields = fields


class StartInterviewSerializer(serializers.Serializer):
    interview_type = serializers.ChoiceField(choices=InterviewSession.INTERVIEW_TYPES)
    difficulty = serializers.ChoiceField(choices=InterviewSession.DIFFICULTIES, default='beginner')
    role = serializers.CharField(max_length=200, required=False, allow_blank=True)
    company = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    resume_id = serializers.IntegerField(required=False, allow_null=True)
    total_questions = serializers.IntegerField(min_value=3, max_value=10, default=5)


class SubmitAnswerSerializer(serializers.Serializer):
    answer_text = serializers.CharField(min_length=1, max_length=20000)
    time_taken_seconds = serializers.IntegerField(min_value=0, max_value=36000, default=0)


class PracticeQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeQuestion
        fields = ['id', 'question', 'category', 'difficulty', 'role', 'ideal_answer', 'keywords', 'created_at']
        read_only_fields = fields


class GeneratePracticeSerializer(serializers.Serializer):
    category = serializers.ChoiceField(choices=['hr', 'technical', 'coding', 'behavioral', 'situational'])
    difficulty = serializers.ChoiceField(choices=InterviewSession.DIFFICULTIES, default='beginner')
    role = serializers.CharField(max_length=200, required=False, allow_blank=True, default='')
    count = serializers.IntegerField(min_value=1, max_value=10, default=5)