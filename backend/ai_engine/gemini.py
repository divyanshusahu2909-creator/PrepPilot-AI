"""
Gemini REST client.

Uses the Generative Language API directly over HTTPS so there is no SDK
version churn. When GEMINI_API_KEY is unset and AI_DEMO_MODE is on, engine
functions return clearly-labeled heuristic results instead (demo=True).
"""

import json
import logging
import re
import time

import httpx
from django.conf import settings

logger = logging.getLogger(__name__)

API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'


class AIServiceError(Exception):
    """Raised when the AI provider is unconfigured or fails."""


def ai_configured() -> bool:
    return bool(settings.GEMINI_API_KEY)


def demo_mode_enabled() -> bool:
    return not ai_configured() and settings.AI_DEMO_MODE


def _parse_json(text: str) -> dict:
    text = text.strip()
    text = re.sub(r'^```(?:json)?\s*', '', text)
    text = re.sub(r'\s*```$', '', text)
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find('{'), text.rfind('}')
        if start == -1 or end <= start:
            raise AIServiceError('The AI returned an unreadable response. Please try again.')
        try:
            data = json.loads(text[start:end + 1])
        except json.JSONDecodeError as exc:
            raise AIServiceError('The AI returned an unreadable response. Please try again.') from exc
    if not isinstance(data, dict):
        raise AIServiceError('The AI returned an unexpected response format. Please try again.')
    return data


def generate_json(system_prompt: str, user_prompt: str, temperature: float = 0.7) -> dict:
    """Call Gemini and parse a JSON object response. Retries transient failures."""
    if not ai_configured():
        raise AIServiceError('AI is not configured. Set GEMINI_API_KEY in backend/.env.')

    url = f'{API_BASE}/{settings.GEMINI_MODEL}:generateContent'
    payload = {
        'systemInstruction': {'parts': [{'text': system_prompt}]},
        'contents': [{'role': 'user', 'parts': [{'text': user_prompt}]}],
        'generationConfig': {
            'temperature': temperature,
            'responseMimeType': 'application/json',
            'maxOutputTokens': 8192,
        },
    }
    headers = {'x-goog-api-key': settings.GEMINI_API_KEY}

    last_error = None
    for attempt in range(3):
        try:
            response = httpx.post(url, headers=headers, json=payload,
                                  timeout=settings.GEMINI_TIMEOUT_SECONDS)
            if response.status_code in (429, 500, 502, 503, 504) and attempt < 2:
                time.sleep(1.5 * (attempt + 1))
                continue
            response.raise_for_status()
            data = response.json()
            candidates = data.get('candidates') or []
            if not candidates:
                raise AIServiceError('The AI did not return a response. Please try again.')
            parts = candidates[0].get('content', {}).get('parts', [])
            text = ''.join(part.get('text', '') for part in parts)
            return _parse_json(text)
        except httpx.HTTPStatusError as exc:
            last_error = exc
            logger.warning('Gemini HTTP %s (attempt %s)', exc.response.status_code, attempt + 1)
            if exc.response.status_code in (400, 401, 403):
                raise AIServiceError(
                    'The AI provider rejected the request. Check that GEMINI_API_KEY is valid.'
                ) from exc
        except httpx.TransportError as exc:
            last_error = exc
            logger.warning('Gemini transport error (attempt %s): %s', attempt + 1, exc)
        except (KeyError, IndexError, ValueError) as exc:
            last_error = exc
            logger.warning('Gemini malformed response (attempt %s): %s', attempt + 1, exc)
        if attempt < 2:
            time.sleep(1.5 * (attempt + 1))

    raise AIServiceError('The AI service is temporarily unavailable. Please try again.') from last_error


def clamp_score(value, default=50) -> int:
    try:
        return max(0, min(100, int(round(float(value)))))
    except (TypeError, ValueError):
        return default


def as_list(value) -> list:
    if isinstance(value, list):
        return [str(item) for item in value if item is not None]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def as_str(value, default='') -> str:
    return str(value) if value is not None else default