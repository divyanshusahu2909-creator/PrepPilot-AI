"""Voice coach: spoken conversation, grammar feedback, communication reports."""

from . import demo, prompts
from .gemini import AIServiceError, ai_configured, as_list, as_str, clamp_score, demo_mode_enabled, generate_json


def _check_configured():
    if not ai_configured():
        raise AIServiceError('AI is not configured. Set GEMINI_API_KEY in backend/.env.')


def _normalize_reply(result: dict) -> dict:
    corrections = []
    for item in result.get('grammar_corrections') or []:
        if isinstance(item, dict) and item.get('original'):
            corrections.append({
                'original': as_str(item.get('original')),
                'corrected': as_str(item.get('corrected')),
                'explanation': as_str(item.get('explanation')),
            })
    return {
        'reply': as_str(result.get('reply'), "Could you tell me more about that?"),
        'grammar_corrections': corrections[:3],
        'fluency_note': as_str(result.get('fluency_note')),
        'demo': False,
    }


def opening_message(mode: str, topic: str = '') -> dict:
    if demo_mode_enabled():
        return demo.voice_opening(mode, topic)
    _check_configured()
    return _normalize_reply(generate_json(prompts.VOICE_REPLY_SYSTEM, prompts.voice_opening(mode, topic), temperature=0.8))


def reply(mode: str, topic: str, history: list, user_text: str) -> dict:
    if demo_mode_enabled():
        return demo.voice_reply(mode, topic, history, user_text)
    _check_configured()
    return _normalize_reply(generate_json(
        prompts.VOICE_REPLY_SYSTEM, prompts.voice_reply(mode, topic, history, user_text), temperature=0.8,
    ))


def communication_report(messages: list, metrics: dict) -> dict:
    if demo_mode_enabled():
        return demo.communication_report(messages, metrics)
    _check_configured()
    result = generate_json(prompts.COMMUNICATION_REPORT_SYSTEM, prompts.communication_report(messages, metrics), temperature=0.4)
    corrections = []
    for item in result.get('grammar_corrections') or []:
        if isinstance(item, dict) and item.get('original'):
            corrections.append({
                'original': as_str(item.get('original')),
                'corrected': as_str(item.get('corrected')),
                'explanation': as_str(item.get('explanation')),
            })
    return {
        'fluency_score': clamp_score(result.get('fluency_score')),
        'grammar_score': clamp_score(result.get('grammar_score')),
        'pronunciation_score': clamp_score(result.get('pronunciation_score')),
        'confidence_score': clamp_score(result.get('confidence_score')),
        'vocabulary_score': clamp_score(result.get('vocabulary_score')),
        'overall_score': clamp_score(result.get('overall_score')),
        'strengths': as_list(result.get('strengths')),
        'improvements': as_list(result.get('improvements')),
        'grammar_corrections': corrections,
        'detailed_feedback': as_str(result.get('detailed_feedback')),
        'demo': False,
    }


def daily_exercises() -> dict:
    # Curated exercises are always real content; AI adds a fresh topic set when configured.
    base = demo.daily_exercises()
    if not ai_configured():
        return base
    try:
        result = generate_json(
            'You are an English speaking coach. Respond with ONLY JSON: '
            '{"daily_exercise": {"title": "...", "prompt": "...", "tip": "...", "duration_minutes": 5}, '
            '"topics": ["5 fresh impromptu speaking topics"]}',
            'Create one fresh daily speaking exercise and 5 random impromptu topics for an interview-prep candidate.',
            temperature=0.9,
        )
        exercise = result.get('daily_exercise') or {}
        topics = as_list(result.get('topics'))
        if exercise.get('prompt') and topics:
            return {
                'daily_exercise': {
                    'title': as_str(exercise.get('title'), base['daily_exercise']['title']),
                    'prompt': as_str(exercise.get('prompt')),
                    'tip': as_str(exercise.get('tip')),
                    'duration_minutes': int(exercise.get('duration_minutes') or 5),
                },
                'topics': topics[:5],
                'demo': False,
            }
    except AIServiceError:
        pass
    base['demo'] = False
    return base