"""Practice question bank generation."""

from . import demo, prompts
from .gemini import AIServiceError, ai_configured, as_list, as_str, demo_mode_enabled, generate_json

VALID_CATEGORIES = {'hr', 'technical', 'coding', 'behavioral', 'situational'}


def generate_questions(category: str, difficulty: str, role: str, count: int = 5) -> dict:
    count = max(1, min(10, count))
    if demo_mode_enabled():
        return {'questions': demo.practice_questions(category, difficulty, role, count), 'demo': True}
    if not ai_configured():
        raise AIServiceError('AI is not configured. Set GEMINI_API_KEY in backend/.env.')

    result = generate_json(
        prompts.PRACTICE_SYSTEM, prompts.practice_questions(category, difficulty, role, count), temperature=0.8,
    )
    questions = []
    for item in result.get('questions', [])[:count]:
        if not isinstance(item, dict) or not item.get('question'):
            continue
        cat = item.get('category') if item.get('category') in VALID_CATEGORIES else category
        questions.append({
            'question': as_str(item['question']),
            'category': cat,
            'ideal_answer': as_str(item.get('ideal_answer')),
            'keywords': as_list(item.get('keywords')),
        })
    if not questions:
        raise AIServiceError('The AI could not generate questions. Please try again.')
    return {'questions': questions, 'demo': False}