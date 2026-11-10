"""
Views for the resumes app.
"""

import io
import logging

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import ScopedRateThrottle

from accounts.models import UserActivity
from ai_engine.gemini import AIServiceError
from ai_engine.resume_analyzer import analyze_resume, generate_resume_questions
from .models import Resume, ResumeAnalysis
from .serializers import ResumeSerializer, ResumeAnalysisSerializer, ResumeWithAnalysisSerializer

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_obj) -> str:
    """Extract text content from a PDF file using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
        file_bytes = file_obj.read()
        file_obj.seek(0)
        pdf_document = fitz.open(stream=file_bytes, filetype='pdf')
        text_parts = []
        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]
            text_parts.append(page.get_text())
        pdf_document.close()
        extracted = '\n'.join(text_parts).strip()
        return extracted
    except ImportError:
        logger.error("PyMuPDF not installed. Cannot extract PDF text.")
        return ""
    except Exception as e:
        logger.error(f"Failed to extract PDF text: {e}")
        return ""


class ResumePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class ResumeUploadView(APIView):
    """
    POST /api/resumes/upload/
    Upload a PDF resume. Validates type and size, extracts text, saves.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided. Please upload a PDF file.'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded_file = request.FILES['file']

        # Validate file type
        allowed_content_types = ['application/pdf']
        if uploaded_file.content_type not in allowed_content_types and not uploaded_file.name.lower().endswith('.pdf'):
            return Response(
                {'error': 'Only PDF files are accepted. Please upload a PDF resume.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file size
        max_size = settings.MAX_UPLOAD_SIZE
        if uploaded_file.size > max_size:
            max_mb = max_size // (1024 * 1024)
            return Response(
                {'error': f'File size exceeds the {max_mb}MB limit. Please upload a smaller file.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate it's actually a PDF (magic bytes)
        header = uploaded_file.read(4)
        uploaded_file.seek(0)
        if header != b'%PDF':
            return Response(
                {'error': 'The uploaded file is not a valid PDF document.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Extract text from PDF
        extracted_text = extract_text_from_pdf(uploaded_file)

        # Save resume to database
        resume = Resume.objects.create(
            user=request.user,
            file=uploaded_file,
            filename=uploaded_file.name,
            file_size=uploaded_file.size,
            extracted_text=extracted_text,
            is_active=True,
        )

        # Log activity
        UserActivity.log(
            request.user,
            'resume_upload',
            f'Uploaded resume: {uploaded_file.name}',
            {'resume_id': resume.id, 'file_size': uploaded_file.size},
        )

        logger.info(f"Resume uploaded by {request.user.email}: {resume.filename} ({resume.file_size} bytes)")
        serializer = ResumeSerializer(resume, context={'request': request})
        return Response(
            {
                'message': 'Resume uploaded successfully.',
                'resume': serializer.data,
                'text_extracted': bool(extracted_text),
            },
            status=status.HTTP_201_CREATED,
        )


class ResumeListView(generics.ListAPIView):
    """
    GET /api/resumes/
    List all resumes for the authenticated user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ResumeWithAnalysisSerializer
    pagination_class = ResumePagination

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user).order_by('-uploaded_at')


class ResumeDetailView(generics.RetrieveDestroyAPIView):
    """
    GET /api/resumes/<id>/   → Get resume detail.
    DELETE /api/resumes/<id>/ → Delete resume.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ResumeWithAnalysisSerializer

    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        resume = self.get_object()
        filename = resume.filename
        resume.delete()
        return Response(
            {'message': f'Resume "{filename}" deleted successfully.'},
            status=status.HTTP_200_OK,
        )


class ResumeAnalyzeView(APIView):
    """
    POST /api/resumes/<id>/analyze/
    Trigger AI analysis of a specific resume.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai'

    def post(self, request, pk, *args, **kwargs):
        try:
            resume = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'Resume not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not resume.extracted_text:
            return Response(
                {'error': 'No text could be extracted from this resume. Please re-upload the PDF.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get target role from profile or request body
        target_role = request.data.get('target_role', '')
        if not target_role:
            try:
                target_role = request.user.profile.target_role or 'General'
            except Exception:
                target_role = 'General'

        try:
            analysis_data = analyze_resume(resume.extracted_text, target_role)
        except AIServiceError as e:
            return Response(
                {
                    'error': 'AI service unavailable.',
                    'detail': str(e),
                    'hint': 'Set GEMINI_API_KEY in backend/.env for real AI analysis, or enable AI_DEMO_MODE.',
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except Exception as e:
            logger.error(f"Resume analysis failed for resume {pk}: {e}")
            return Response(
                {
                    'error': 'Resume analysis failed. Please try again later.',
                    'detail': str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Save analysis result
        analysis = ResumeAnalysis.objects.create(
            resume=resume,
            overall_score=analysis_data.get('overall_score', 0),
            ats_score=analysis_data.get('ats_score', 0),
            ats_disclaimer=analysis_data.get('ats_disclaimer', ResumeAnalysis._meta.get_field('ats_disclaimer').default),
            skills_found=analysis_data.get('skills_found', []),
            missing_skills=analysis_data.get('missing_skills', []),
            education_feedback=analysis_data.get('education_feedback', ''),
            experience_feedback=analysis_data.get('experience_feedback', ''),
            grammar_issues=analysis_data.get('grammar_issues', []),
            formatting_issues=analysis_data.get('formatting_issues', []),
            improvements=analysis_data.get('improvements', []),
            improved_summary=analysis_data.get('improved_summary', ''),
            strengths=analysis_data.get('strengths', []),
            weaknesses=analysis_data.get('weaknesses', []),
            raw_analysis=analysis_data,
        )

        # Log activity
        UserActivity.log(
            request.user,
            'resume_analyzed',
            f'Resume analyzed: {resume.filename} (Score: {analysis.overall_score}/100)',
            {'resume_id': resume.id, 'analysis_id': analysis.id, 'score': analysis.overall_score},
        )

        logger.info(f"Resume analyzed for {request.user.email}: score={analysis.overall_score}")
        serializer = ResumeAnalysisSerializer(analysis)
        return Response(
            {
                'message': 'Resume analyzed successfully.',
                'analysis': serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )


class ResumeAnalysisHistoryView(generics.ListAPIView):
    """
    GET /api/resumes/analyses/
    Get all past resume analyses for the authenticated user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ResumeAnalysisSerializer
    pagination_class = ResumePagination

    def get_queryset(self):
        return ResumeAnalysis.objects.filter(
            resume__user=self.request.user
        ).select_related('resume').order_by('-analyzed_at')


class ResumeQuestionsView(APIView):
    """
    POST /api/resumes/<id>/questions/
    Generate interview questions based on the uploaded resume.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai'

    def post(self, request, pk, *args, **kwargs):
        resume = get_object_or_404(Resume, pk=pk, user=request.user)
        if not resume.extracted_text:
            return Response(
                {'error': 'No text could be extracted from this resume. Please re-upload the PDF.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            count = max(3, min(10, int(request.data.get('count', 6))))
        except (TypeError, ValueError):
            count = 6
        try:
            result = generate_resume_questions(resume.extracted_text, count)
        except AIServiceError as e:
            return Response({'error': str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response(result)
