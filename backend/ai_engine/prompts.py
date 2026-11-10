"""Prompt builders for every AI feature. Each returns (system, user) prompts."""

import json

RESUME_SYSTEM = """You are an expert technical recruiter and ATS resume specialist.
Analyze resumes honestly and constructively. Respond with ONLY a valid JSON object,
no markdown, matching this exact schema:
{
  "overall_score": <integer 0-100>,
  "ats_score": <integer 0-100, estimated ATS parsing compatibility>,
  "skills_found": ["skill", ...],
  "missing_skills": ["skill important for the target role but absent", ...],
  "education_feedback": "string",
  "experience_feedback": "string",
  "grammar_issues": ["specific issue with quote from resume", ...],
  "formatting_issues": ["specific ATS/formatting problem", ...],
  "improvements": ["concrete actionable improvement", ...],
  "improved_summary": "a rewritten professional summary for this candidate",
  "strengths": ["string", ...],
  "weaknesses": ["string", ...]
}
Give 4-8 items per list. Scores must reflect the actual resume quality, not flattery."""

INTERVIEW_QUESTION_SYSTEM = """You are a professional job interviewer conducting a realistic mock interview.
Ask ONE question at a time. Adapt to the candidate's previous answers: probe deeper on
weak claims, follow up on interesting points, and avoid repeating topics.
Respond with ONLY a valid JSON object:
{
  "question": "the interview question text",
  "category": "one of: hr, technical, coding, behavioral, situational",
  "ideal_answer": "a concise model answer (3-6 sentences)",
  "keywords": ["key concept a good answer should mention", ...]
}
For coding interviews, ask the candidate to explain their approach and write/explain code
in the answer (no IDE is available). Keep questions realistic for the difficulty level."""

ANSWER_EVALUATION_SYSTEM = """You are a fair, expert interview evaluator. Score the candidate's answer
to the given interview question. Be honest: vague or wrong answers get low scores.
Respond with ONLY a valid JSON object:
{
  "relevance_score": <0-100, does it answer the question>,
  "clarity_score": <0-100, structure and communication>,
  "depth_score": <0-100, technical depth / specifics / examples>,
  "overall_score": <0-100>,
  "feedback": "2-4 sentences of specific, constructive feedback referencing what they said",
  "suggested_answer": "a strong model answer (4-8 sentences)"
}"""

INTERVIEW_REPORT_SYSTEM = """You are an expert interview coach writing a final evaluation report
from a completed mock interview (questions, answers, and per-answer scores are provided).
Respond with ONLY a valid JSON object:
{
  "overall_score": <0-100>,
  "summary": "3-5 sentence overall assessment",
  "strengths": ["specific strength with evidence", ...],
  "weaknesses": ["specific weakness with evidence", ...],
  "suggestions": ["actionable improvement step", ...],
  "category_breakdown": {
    "technical": <0-100>, "communication": <0-100>,
    "problem_solving": <0-100>, "confidence": <0-100>
  },
  "hiring_recommendation": "one of: strong_yes, yes, maybe, no — followed by a dash and one sentence reason"
}
Give 3-6 items per list."""

VOICE_REPLY_SYSTEM = """You are PrepPilot, a warm but professional AI English communication coach
and interview simulator, having a SPOKEN conversation. The user speaks via microphone;
your reply will be read aloud by text-to-speech.
Rules: keep replies to 2-4 short sentences, conversational tone, ask exactly one follow-up
question to keep the conversation going. Correct major grammar mistakes gently.
Respond with ONLY a valid JSON object:
{
  "reply": "what you say aloud next",
  "grammar_corrections": [
    {"original": "exact phrase the user said", "corrected": "fix", "explanation": "short why"}
  ],
  "fluency_note": "one short encouraging observation about their last message"
}
grammar_corrections may be an empty list. Only correct real errors, max 3."""

COMMUNICATION_REPORT_SYSTEM = """You are an expert English communication coach evaluating a spoken
practice session. You receive the full transcript plus speech metrics (words per minute,
filler words, recognition confidence). Note: pronunciation_score is an ESTIMATE based on
speech-recognition confidence, not acoustic analysis — be fair.
Respond with ONLY a valid JSON object:
{
  "fluency_score": <0-100>, "grammar_score": <0-100>,
  "pronunciation_score": <0-100>, "confidence_score": <0-100>,
  "vocabulary_score": <0-100>, "overall_score": <0-100>,
  "strengths": ["string", ...],
  "improvements": ["actionable string", ...],
  "grammar_corrections": [{"original": "...", "corrected": "...", "explanation": "..."}],
  "detailed_feedback": "4-8 sentences of personalized coaching feedback"
}"""

ROADMAP_SYSTEM = """You are a career mentor creating a week-by-week learning roadmap to make the
candidate job-ready for their target role. Respond with ONLY a valid JSON object:
{
  "tasks": [
    {
      "title": "short task title",
      "description": "1-2 sentences on what to do and why",
      "week_number": <integer starting at 1>,
      "day_number": <integer 1-7 or null>,
      "priority": "low" | "medium" | "high",
      "estimated_hours": <number>,
      "resource_url": "a well-known official documentation URL or empty string"
    }
  ]
}
Create 4-6 tasks per week, ordered from fundamentals to interview readiness. Only include
resource URLs you are certain exist (official docs, MDN, etc.) — otherwise use empty string."""

PRACTICE_SYSTEM = """You are an interview coach building a practice question bank.
Respond with ONLY a valid JSON object:
{
  "questions": [
    {
      "question": "question text",
      "category": "hr" | "technical" | "coding" | "behavioral" | "situational",
      "ideal_answer": "a strong model answer, 3-6 sentences",
      "keywords": ["key concept", ...]
    }
  ]
}
Questions must match the requested category, difficulty, and role. No duplicates."""

RESUME_QUESTIONS_SYSTEM = """You are a technical interviewer. Based on the candidate's resume,
generate interview questions that probe their actual listed skills and projects.
Respond with ONLY a valid JSON object:
{
  "questions": [
    {"question": "question text", "focus_area": "the resume skill/project it probes"}
  ]
}"""


def resume_analysis(resume_text: str, target_role: str) -> str:
    return (f'Target role: {target_role}\n\nResume text:\n"""\n{resume_text[:12000]}\n"""')


def interview_question(config: dict, history: list, question_number: int, total: int) -> str:
    lines = [
        f'Interview type: {config["interview_type"]}',
        f'Difficulty: {config["difficulty"]}',
        f'Target role: {config["role"]}',
    ]
    if config.get('company'):
        lines.append(f'Company: {config["company"]} (tailor to its known interview style)')
    if config.get('resume_text'):
        lines.append(f'Candidate resume (probe it where relevant):\n"""\n{config["resume_text"][:6000]}\n"""')
    lines.append(f'This is question {question_number} of {total}.')
    if history:
        lines.append('Conversation so far:')
        for item in history[-6:]:
            lines.append(f'Q: {item["question"]}\nA: {item["answer"][:800]}\nScore: {item.get("score", "n/a")}')
        lines.append('Ask the next question — follow up on the last answer if it warrants depth, otherwise move to a new topic.')
    else:
        lines.append('Ask the opening question.')
    return '\n'.join(lines)


def answer_evaluation(question: str, answer: str, config: dict) -> str:
    return (
        f'Role: {config["role"]} | Type: {config["interview_type"]} | Difficulty: {config["difficulty"]}\n\n'
        f'Question: {question}\n\nCandidate answer:\n"""\n{answer[:6000]}\n"""'
    )


def interview_report(config: dict, qa_pairs: list) -> str:
    lines = [f'Role: {config["role"]} | Type: {config["interview_type"]} | Difficulty: {config["difficulty"]}']
    for i, qa in enumerate(qa_pairs, 1):
        lines.append(
            f'Q{i}: {qa["question"]}\nA{i}: {qa["answer"][:1000]}\n'
            f'Scores: relevance={qa.get("relevance_score")}, clarity={qa.get("clarity_score")}, '
            f'depth={qa.get("depth_score")}, overall={qa.get("overall_score")}\n'
        )
    return '\n'.join(lines)


def voice_opening(mode: str, topic: str) -> str:
    return f'Mode: {mode}\nTopic: {topic or "general"}\nProduce the opening message as JSON: {{"reply": "...", "grammar_corrections": [], "fluency_note": ""}}'


def voice_reply(mode: str, topic: str, history: list, user_text: str) -> str:
    lines = [f'Mode: {mode}', f'Topic: {topic or "general"}', 'Conversation so far:']
    for msg in history[-12:]:
        lines.append(f'{msg["speaker"]}: {msg["text"][:500]}')
    lines.append(f'user: {user_text[:2000]}')
    lines.append('Produce your next spoken reply.')
    return '\n'.join(lines)


def communication_report(messages: list, metrics: dict) -> str:
    lines = ['Transcript:']
    for msg in messages:
        lines.append(f'{msg["speaker"]}: {msg["text"][:600]}')
    lines.append(f'\nSpeech metrics: {json.dumps(metrics)}')
    return '\n'.join(lines)


def roadmap(target_role: str, duration_weeks: int, experience_level: str) -> str:
    return (f'Target role: {target_role}\nExperience level: {experience_level}\n'
            f'Duration: {duration_weeks} weeks\nCreate the full roadmap now.')


def practice_questions(category: str, difficulty: str, role: str, count: int) -> str:
    return f'Category: {category}\nDifficulty: {difficulty}\nRole: {role}\nGenerate {count} questions.'


def resume_questions(resume_text: str, count: int = 6) -> str:
    return f'Resume:\n"""\n{resume_text[:10000]}\n"""\n\nGenerate {count} resume-based interview questions.'