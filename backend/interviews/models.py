from django.conf import settings
from django.db import models


class InterviewSession(models.Model):
    INTERVIEW_TYPES = [
        ('hr', 'HR Interview'),
        ('technical', 'Technical Interview'),
        ('coding', 'Coding Interview'),
        ('company', 'Company-specific Interview'),
    ]
    DIFFICULTIES = [
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    ]
    STATUSES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='interview_sessions')
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPES)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTIES, default='beginner')
    role = models.CharField(max_length=200, default='Software Engineer')
    company = models.CharField(max_length=200, blank=True)
    resume = models.ForeignKey('resumes.Resume', null=True, blank=True, on_delete=models.SET_NULL)
    status = models.CharField(max_length=20, choices=STATUSES, default='in_progress')
    total_questions = models.PositiveIntegerField(default=5)
    current_question_index = models.PositiveIntegerField(default=0)
    overall_score = models.FloatField(null=True, blank=True)
    report = models.JSONField(default=dict, blank=True)
    demo = models.BooleanField(default=False)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.user.email} — {self.interview_type} ({self.role})'

    @property
    def answered_count(self):
        return self.questions.filter(answer__isnull=False).count()


class InterviewQuestion(models.Model):
    session = models.ForeignKey(InterviewSession, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    category = models.CharField(max_length=30, default='technical')
    order_index = models.PositiveIntegerField(default=0)
    ideal_answer = models.TextField(blank=True)
    keywords = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order_index']
        unique_together = [('session', 'order_index')]

    def __str__(self):
        return f'Q{self.order_index + 1}: {self.text[:60]}'


class InterviewAnswer(models.Model):
    question = models.OneToOneField(InterviewQuestion, on_delete=models.CASCADE, related_name='answer')
    text = models.TextField()
    time_taken_seconds = models.PositiveIntegerField(default=0)
    relevance_score = models.FloatField(default=0)
    clarity_score = models.FloatField(default=0)
    depth_score = models.FloatField(default=0)
    overall_score = models.FloatField(default=0)
    feedback = models.TextField(blank=True)
    suggested_answer = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Answer to Q{self.question.order_index + 1} — {self.overall_score}/100'


class PracticeQuestion(models.Model):
    DIFFICULTIES = InterviewSession.DIFFICULTIES

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='practice_questions')
    question = models.TextField()
    category = models.CharField(max_length=30, default='technical')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTIES, default='beginner')
    role = models.CharField(max_length=200, blank=True)
    ideal_answer = models.TextField(blank=True)
    keywords = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.category}: {self.question[:60]}'