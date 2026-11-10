"""Learning roadmap generation."""

from . import demo, prompts
from .gemini import AIServiceError, ai_configured, as_str, demo_mode_enabled, generate_json

VALID_PRIORITIES = {'low', 'medium', 'high'}


def generate_roadmap(target_role: str, duration_weeks: int, experience_level: str = 'fresher') -> dict:
    if demo_mode_enabled():
        return demo.roadmap(target_role, duration_weeks, experience_level)
    if not ai_configured():
        raise AIServiceError('AI is not configured. Set GEMINI_API_KEY in backend/.env.')

    result = generate_json(
        prompts.ROADMAP_SYSTEM, prompts.roadmap(target_role, duration_weeks, experience_level), temperature=0.6,
    )
    tasks = []
    for item in result.get('tasks', []):
        if not isinstance(item, dict) or not item.get('title'):
            continue
        week = max(1, min(duration_weeks, int(item.get('week_number') or 1)))
        day = item.get('day_number')
        day = max(1, min(7, int(day))) if isinstance(day, (int, float)) else None
        priority = item.get('priority') if item.get('priority') in VALID_PRIORITIES else 'medium'
        try:
            hours = max(0.5, min(40, float(item.get('estimated_hours') or 2)))
        except (TypeError, ValueError):
            hours = 2
        url = as_str(item.get('resource_url'))
        if url and not url.startswith(('http://', 'https://')):
            url = ''
        tasks.append({
            'title': as_str(item['title'])[:300],
            'description': as_str(item.get('description')),
            'week_number': week,
            'day_number': day,
            'priority': priority,
            'estimated_hours': hours,
            'resource_url': url,
        })
    if not tasks:
        raise AIServiceError('The AI could not generate a roadmap. Please try again.')
    return {'tasks': tasks, 'demo': False}