"""Resume analysis: real Gemini when configured, labeled heuristic demo otherwise."""

from . import demo, prompts
from .gemini import AIServiceError, ai_configured, as_list, as_str, clamp_score, demo_mode_enabled, generate_json


def analyze_resume(resume_text: str, target_role: str) -> dict:
    if demo_mode_enabled():
        return demo.analyze_resume(resume_text, target_role)
    if not ai_configured():
        raise AIServiceError('AI is not configured. Set GEMINI_API_KEY in backend/.env.')

    result = generate_json(prompts.RESUME_SYSTEM, prompts.resume_analysis(resume_text, target_role), temperature=0.4)
    return {
        'overall_score': clamp_score(result.get('overall_score')),
        'ats_score': clamp_score(result.get('ats_score')),
        'skills_found': as_list(result.get('skills_found')),
        'missing_skills': as_list(result.get('missing_skills')),
        'education_feedback': as_str(result.get('education_feedback')),
        'experience_feedback': as_str(result.get('experience_feedback')),
        'grammar_issues': as_list(result.get('grammar_issues')),
        'formatting_issues': as_list(result.get('formatting_issues')),
        'improvements': as_list(result.get('improvements')),
        'improved_summary': as_str(result.get('improved_summary')),
        'strengths': as_list(result.get('strengths')),
        'weaknesses': as_list(result.get('weaknesses')),
        'demo': False,
    }


def generate_resume_questions(resume_text: str, count: int = 6) -> dict:
    if demo_mode_enabled():
        return {'questions': demo.resume_questions(resume_text, count), 'demo': True}
    if not ai_configured():
        raise AIServiceError('AI is not configured. Set GEMINI_API_KEY in backend/.env.')

    result = generate_json(prompts.RESUME_QUESTIONS_SYSTEM, prompts.resume_questions(resume_text, count), temperature=0.6)
    questions = []
    for item in result.get('questions', [])[:count]:
        if isinstance(item, dict) and item.get('question'):
            questions.append({'question': as_str(item['question']), 'focus_area': as_str(item.get('focus_area'))})
    return {'questions': questions, 'demo': False}