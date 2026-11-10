"""Interview question generation, answer evaluation, and final reports."""

from . import demo, prompts
from .gemini import AIServiceError, ai_configured, as_list, as_str, clamp_score, demo_mode_enabled, generate_json


def _check_configured():
    if not ai_configured():
        raise AIServiceError('AI is not configured. Set GEMINI_API_KEY in backend/.env.')


def generate_question(config: dict, history: list, question_number: int, total: int) -> dict:
    if demo_mode_enabled():
        return demo.interview_question(config, history, question_number, total)
    _check_configured()
    result = generate_json(
        prompts.INTERVIEW_QUESTION_SYSTEM,
        prompts.interview_question(config, history, question_number, total),
        temperature=0.8,
    )
    return {
        'question': as_str(result.get('question'), 'Tell me about yourself.'),
        'category': as_str(result.get('category'), config['interview_type']),
        'ideal_answer': as_str(result.get('ideal_answer')),
        'keywords': as_list(result.get('keywords')),
        'demo': False,
    }


def evaluate_answer(question_text: str, answer_text: str, config: dict, keywords: list, ideal_answer: str = '') -> dict:
    if demo_mode_enabled():
        result = demo.evaluate_answer(question_text, answer_text, config, keywords)
        result['suggested_answer'] = ideal_answer
        return result
    _check_configured()
    result = generate_json(
        prompts.ANSWER_EVALUATION_SYSTEM,
        prompts.answer_evaluation(question_text, answer_text, config),
        temperature=0.3,
    )
    return {
        'relevance_score': clamp_score(result.get('relevance_score')),
        'clarity_score': clamp_score(result.get('clarity_score')),
        'depth_score': clamp_score(result.get('depth_score')),
        'overall_score': clamp_score(result.get('overall_score')),
        'feedback': as_str(result.get('feedback')),
        'suggested_answer': as_str(result.get('suggested_answer'), ideal_answer),
        'demo': False,
    }


def generate_report(config: dict, qa_pairs: list) -> dict:
    if not qa_pairs:
        return {
            'overall_score': 0, 'summary': 'No answers were submitted.',
            'strengths': [], 'weaknesses': ['Interview completed without answers.'],
            'suggestions': ['Answer the questions to get a meaningful evaluation.'],
            'category_breakdown': {'technical': 0, 'communication': 0, 'problem_solving': 0, 'confidence': 0},
            'hiring_recommendation': 'no — no answers submitted', 'demo': demo_mode_enabled(),
        }
    if demo_mode_enabled():
        return demo.interview_report(config, qa_pairs)
    _check_configured()
    result = generate_json(prompts.INTERVIEW_REPORT_SYSTEM, prompts.interview_report(config, qa_pairs), temperature=0.4)
    breakdown = result.get('category_breakdown') or {}
    return {
        'overall_score': clamp_score(result.get('overall_score')),
        'summary': as_str(result.get('summary')),
        'strengths': as_list(result.get('strengths')),
        'weaknesses': as_list(result.get('weaknesses')),
        'suggestions': as_list(result.get('suggestions')),
        'category_breakdown': {
            'technical': clamp_score(breakdown.get('technical')),
            'communication': clamp_score(breakdown.get('communication')),
            'problem_solving': clamp_score(breakdown.get('problem_solving')),
            'confidence': clamp_score(breakdown.get('confidence')),
        },
        'hiring_recommendation': as_str(result.get('hiring_recommendation')),
        'demo': False,
    }