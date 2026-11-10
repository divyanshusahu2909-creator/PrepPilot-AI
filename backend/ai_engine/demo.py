"""
Clearly-labeled demo mode: heuristic analysis and curated content used ONLY
when GEMINI_API_KEY is not configured. Every result carries demo=True so the
UI can disclose that feedback is heuristic, not real AI.
"""

import hashlib
import random
import re
from datetime import date

FILLER_WORDS = ['um', 'uh', 'er', 'ah', 'like', 'basically', 'actually', 'literally', 'you know']

SKILL_BANK = [
    'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'go', 'rust', 'sql', 'nosql',
    'react', 'angular', 'vue', 'node.js', 'django', 'flask', 'fastapi', 'spring', 'express',
    'html', 'css', 'tailwind', 'redux', 'graphql', 'rest', 'git', 'docker', 'kubernetes',
    'aws', 'azure', 'gcp', 'linux', 'ci/cd', 'jenkins', 'terraform', 'mysql', 'postgresql',
    'mongodb', 'redis', 'kafka', 'rabbitmq', 'tensorflow', 'pytorch', 'pandas', 'numpy',
    'scikit-learn', 'machine learning', 'deep learning', 'nlp', 'data analysis', 'excel',
    'tableau', 'power bi', 'figma', 'agile', 'scrum', 'jira', 'selenium', 'pytest',
    'communication', 'leadership', 'teamwork', 'problem solving', 'project management',
]

ROLE_SKILLS = {
    'software': ['git', 'sql', 'docker', 'rest', 'ci/cd', 'testing', 'data structures', 'system design'],
    'data': ['sql', 'python', 'pandas', 'machine learning', 'statistics', 'tableau', 'tensorflow'],
    'frontend': ['javascript', 'typescript', 'react', 'css', 'html', 'redux', 'testing', 'git'],
    'default': ['communication', 'problem solving', 'teamwork', 'git', 'sql'],
}

ACTION_VERBS = ['built', 'developed', 'designed', 'implemented', 'led', 'created', 'improved',
                'reduced', 'increased', 'managed', 'launched', 'optimized', 'automated', 'delivered']

HR_QUESTIONS = {
    'beginner': [
        ('Tell me about yourself.', 'A concise 60-90 second summary: education, key skills, a project or internship, and why this role excites you.', ['background', 'skills', 'goals']),
        ('Why do you want to work here?', 'Connect your goals to the company\'s mission, products, or culture with something specific you researched.', ['company', 'values', 'motivation']),
        ('What are your strengths?', 'Name 2-3 strengths relevant to the job and back each with a brief concrete example.', ['strength', 'example', 'relevant']),
        ('What is your greatest weakness?', 'Pick a real, non-critical weakness and explain the concrete steps you are taking to improve it.', ['weakness', 'improvement', 'self-awareness']),
        ('Where do you see yourself in five years?', 'Show ambition aligned with the role: growing expertise, owning projects, mentoring — not a rigid title chase.', ['growth', 'learning', 'career']),
        ('Why should we hire you?', 'Summarize the match between your skills, your enthusiasm, and what the team needs; add one differentiator.', ['skills', 'fit', 'value']),
    ],
    'intermediate': [
        ('Describe a conflict with a teammate and how you resolved it.', 'Use STAR: situation, task, action (listening, compromise), result — show maturity and collaboration.', ['conflict', 'resolution', 'communication']),
        ('Tell me about a time you failed.', 'Own a genuine failure, what you learned, and how you changed your approach afterwards.', ['failure', 'learning', 'accountability']),
        ('How do you prioritize work under tight deadlines?', 'Describe a concrete framework (impact vs urgency), stakeholder communication, and an example.', ['prioritization', 'deadlines', 'trade-offs']),
        ('Describe a time you showed leadership.', 'Any context counts: leading a project, mentoring, organizing. Focus on influence and outcomes.', ['leadership', 'initiative', 'outcome']),
        ('What motivates you?', 'Be authentic: learning, impact, ownership — and tie it to how this role provides that.', ['motivation', 'values', 'fit']),
        ('How do you handle feedback and criticism?', 'Show openness: listen, ask clarifying questions, act on it, follow up. Give a real example.', ['feedback', 'growth', 'example']),
    ],
    'advanced': [
        ('Tell me about a time you drove a major initiative with ambiguous requirements.', 'STAR at scale: how you created clarity, aligned stakeholders, de-risked, and delivered measurable impact.', ['ambiguity', 'stakeholders', 'impact']),
        ('Describe a situation where you had to influence without authority.', 'Show persuasion through data, relationships, and shared goals rather than hierarchy.', ['influence', 'persuasion', 'collaboration']),
        ('How have you developed others or built team capability?', 'Concrete mentoring, hiring, process improvements, and the resulting team growth.', ['mentoring', 'team', 'growth']),
        ('Tell me about a difficult trade-off you made.', 'A real decision with costs on both sides; explain your reasoning framework and the outcome.', ['trade-off', 'decision', 'judgment']),
        ('What is your philosophy on quality vs speed?', 'Nuanced answer: context-dependent standards, technical debt management, an example of getting it right.', ['quality', 'speed', 'pragmatism']),
    ],
}

TECH_QUESTIONS = {
    'beginner': [
        ('What is the difference between a list and a tuple in Python?', 'Lists are mutable, tuples immutable; tuples can be dict keys and signal fixed structure. Mention performance and intent.', ['mutable', 'immutable', 'python']),
        ('Explain what an API is and how REST works.', 'An API is a contract between software; REST uses HTTP verbs on resources, stateless requests, and status codes.', ['http', 'stateless', 'resources']),
        ('What is the difference between SQL and NoSQL databases?', 'SQL: structured tables, schemas, joins, ACID. NoSQL: flexible models (document/key-value), horizontal scale, eventual consistency trade-offs.', ['schema', 'scaling', 'acid']),
        ('What is version control and why do we use Git?', 'Git tracks history, enables branching/merging, collaboration, and rollback. Mention commits, branches, pull requests.', ['git', 'branch', 'history']),
        ('Explain variables, data types, and control flow in a language you know.', 'Define each with a tiny example; show you can write basic loops and conditionals.', ['variables', 'loops', 'conditionals']),
        ('What happens when you type a URL into a browser?', 'DNS lookup, TCP/TLS connection, HTTP request, server response, parsing HTML/CSS/JS, rendering.', ['dns', 'http', 'rendering']),
    ],
    'intermediate': [
        ('Explain database indexing and when you would add one.', 'Indexes (B-trees) speed reads at a write/storage cost; add on filtered/joined columns, avoid over-indexing, check query plans.', ['index', 'query', 'trade-off']),
        ('What is the difference between processes and threads?', 'Processes have isolated memory; threads share memory within a process. Discuss concurrency, GIL if Python, and race conditions.', ['memory', 'concurrency', 'race condition']),
        ('How does authentication with JWT work?', 'Server signs a token with claims; client sends it as Bearer; server verifies signature statelessly. Discuss expiry, refresh, and storage risks.', ['token', 'signature', 'expiry']),
        ('Explain REST vs GraphQL.', 'REST: fixed endpoints, possible over/under-fetching. GraphQL: client-specified queries, single endpoint, schema; caching is more complex.', ['endpoints', 'schema', 'fetching']),
        ('What are Docker containers and how do they differ from VMs?', 'Containers share the host kernel, isolate via namespaces/cgroups, are lightweight; VMs virtualize hardware with a full guest OS.', ['kernel', 'isolation', 'image']),
        ('How would you design a URL shortener?', 'Discuss ID generation (base62), storage, read-heavy caching, redirects (301/302), and scale estimates.', ['hash', 'cache', 'scale']),
    ],
    'advanced': [
        ('Design a distributed rate limiter.', 'Token bucket vs sliding window, Redis-backed counters, atomicity (Lua), distributed clock issues, fail-open vs fail-closed.', ['token bucket', 'redis', 'distributed']),
        ('How do you ensure consistency in a microservices architecture?', 'Saga pattern, outbox pattern, idempotency, eventual consistency, event sourcing trade-offs.', ['saga', 'idempotency', 'events']),
        ('Explain how you would diagnose and fix a slow production API.', 'Measure first (APM, traces), find the bottleneck (DB, N+1, locks), optimize queries/caching, load test, monitor.', ['profiling', 'bottleneck', 'caching']),
        ('What are the trade-offs of event-driven architecture?', 'Loose coupling and scalability vs eventual consistency, ordering, debugging complexity, and operational overhead.', ['events', 'consistency', 'coupling']),
        ('How does garbage collection work in your primary language?', 'Explain the mechanism (ref counting + cycles in Python, generational GC in JVM), tuning, and memory leak patterns.', ['gc', 'memory', 'generations']),
    ],
}

CODING_QUESTIONS = {
    'beginner': [
        ('Write a function to check if a string is a palindrome. Explain your approach.', 'Two-pointer or reverse comparison; O(n) time, O(1) space with pointers. Discuss normalization (case, spaces).', ['two pointers', 'O(n)', 'edge cases']),
        ('Write a function that returns the factorial of n, iteratively and recursively.', 'Iterative loop O(n); recursion with base case n<=1; mention stack depth limits.', ['recursion', 'base case', 'loop']),
        ('Find the largest element in an array without using built-in max.', 'Single pass tracking current max; O(n) time O(1) space; handle empty input.', ['single pass', 'O(n)', 'empty input']),
        ('Write a function to count vowels in a string.', 'Iterate and test membership in a set of vowels; O(n); consider case-insensitivity.', ['iteration', 'set', 'case']),
        ('Reverse a linked list. Explain pointer changes step by step.', 'Iterative prev/current/next pointer reversal, O(n) time O(1) space; or recursive.', ['pointers', 'prev', 'O(1) space']),
    ],
    'intermediate': [
        ('Two Sum: return indices of two numbers adding to a target.', 'Hash map of value→index for O(n) time, O(n) space; one pass; handle duplicates.', ['hash map', 'O(n)', 'one pass']),
        ('Detect a cycle in a linked list.', 'Floyd\'s tortoise and hare: slow/fast pointers meet if cycle exists; O(n) time O(1) space.', ['fast slow', 'floyd', 'O(1) space']),
        ('Group anagrams from a list of strings.', 'Hash by sorted string or character count tuple; O(n·k log k); discuss trade-offs.', ['hash', 'sorting', 'complexity']),
        ('Implement an LRU cache with O(1) get and put.', 'Hash map + doubly linked list; move accessed nodes to front, evict tail at capacity.', ['hash map', 'linked list', 'eviction']),
        ('Find the longest substring without repeating characters.', 'Sliding window with a set/map of last indices; O(n) time.', ['sliding window', 'hash', 'O(n)']),
    ],
    'advanced': [
        ('Merge k sorted linked lists efficiently.', 'Min-heap of list heads: O(N log k); or divide-and-conquer pairwise merge. Compare complexities.', ['heap', 'divide and conquer', 'O(N log k)']),
        ('Serialize and deserialize a binary tree.', 'Preorder traversal with null markers; reconstruct recursively; discuss BFS alternative.', ['traversal', 'recursion', 'null markers']),
        ('Solve: minimum window substring containing all characters of a target.', 'Sliding window with frequency maps, contract when valid; O(n).', ['sliding window', 'frequency', 'O(n)']),
        ('Design and implement a thread-safe singleton.', 'Double-checked locking or module-level initialization; discuss language memory model.', ['thread safety', 'locking', 'initialization']),
        ('Find the median of two sorted arrays in O(log(min(m,n))).', 'Binary search the partition point so left halves contain half the elements; handle edge cases.', ['binary search', 'partition', 'logarithmic']),
    ],
}

BEHAVIORAL_QUESTIONS = [
    ('Describe a time you worked under pressure.', 'STAR: a concrete deadline, your calm prioritization, and the successful result.', ['pressure', 'prioritization', 'result']),
    ('Tell me about a time you went above and beyond.', 'A specific story showing ownership beyond your job description and its impact.', ['ownership', 'initiative', 'impact']),
    ('Describe a time you had to learn something quickly.', 'Show your learning process: resources, practice, and how fast you became productive.', ['learning', 'adaptability', 'speed']),
    ('Tell me about a disagreement with a manager.', 'Respectful pushback with data, listening, and a constructive resolution.', ['disagreement', 'respect', 'resolution']),
    ('Give an example of teamwork that achieved a tough goal.', 'Your specific role, how the team coordinated, and the measurable outcome.', ['teamwork', 'role', 'outcome']),
]

VOICE_TOPICS = [
    'Describe your favorite project and why you are proud of it.',
    'Talk about a skill you taught yourself recently.',
    'Describe your ideal work environment.',
    'Talk about a book, movie, or series that influenced you.',
    'Explain your hometown to someone who has never visited.',
    'Describe a challenge you overcame and what it taught you.',
    'Talk about where technology will be in ten years.',
    'Describe a person you admire and why.',
    'Explain a complex concept in simple words.',
    'Talk about your morning routine and habits.',
    'Describe a time you helped someone.',
    'Talk about the importance of communication in teams.',
]

DAILY_EXERCISES = [
    {'title': 'The 60-Second Introduction', 'prompt': 'Introduce yourself as if meeting an interviewer for the first time. Cover who you are, what you do, and what you are aiming for — in about 60 seconds.', 'tip': 'Structure it: present → past → future. Practice until it flows naturally.', 'duration_minutes': 5},
    {'title': 'STAR Storytelling', 'prompt': 'Tell a story about a challenge you solved using the STAR method: Situation, Task, Action, Result.', 'tip': 'Spend most time on Action — what YOU did specifically.', 'duration_minutes': 10},
    {'title': 'Explain It Simply', 'prompt': 'Pick a technical concept you know and explain it so a 12-year-old would understand.', 'tip': 'Use an analogy. Avoid jargon; if you must use a term, define it.', 'duration_minutes': 5},
    {'title': 'Opinion with Reasons', 'prompt': 'Do you prefer remote work or office work? State your opinion and defend it with three reasons and an example.', 'tip': 'Use linking words: firstly, moreover, however, consequently.', 'duration_minutes': 5},
    {'title': 'Describe and Compare', 'prompt': 'Compare two technologies, cities, or jobs you know well. Highlight similarities and differences.', 'tip': 'Use comparative structures: whereas, while, in contrast, similarly.', 'duration_minutes': 8},
    {'title': 'The Impromptu Talk', 'prompt': 'Speak for two minutes about a random topic without preparation. Keep going even if you make mistakes.', 'tip': 'Fluency over perfection — keep talking, correct yourself naturally.', 'duration_minutes': 5},
    {'title': 'Interview Warm-Up', 'prompt': 'Answer three classic questions aloud: Tell me about yourself. Why this role? What is your greatest strength?', 'tip': 'Record yourself mentally: are you concise? Do you give examples?', 'duration_minutes': 10},
]


def _pick(bank, seed_key, count=1):
    """Deterministic-ish pick so a session doesn't repeat questions."""
    rng = random.Random(seed_key)
    return rng.sample(bank, min(count, len(bank)))


def _role_bucket(role: str) -> str:
    role = role.lower()
    if any(k in role for k in ['data', 'ml', 'ai', 'analyst', 'scientist']):
        return 'data'
    if any(k in role for k in ['frontend', 'front-end', 'react', 'ui']):
        return 'frontend'
    if any(k in role for k in ['software', 'developer', 'engineer', 'full stack', 'backend', 'sde']):
        return 'software'
    return 'default'


def analyze_resume(text: str, target_role: str) -> dict:
    lower = text.lower()
    words = text.split()
    found = [s for s in SKILL_BANK if re.search(r'(?<![\w.])' + re.escape(s) + r'(?![\w])', lower)]
    bucket = _role_bucket(target_role)
    expected = ROLE_SKILLS.get(bucket, ROLE_SKILLS['default'])
    missing = [s for s in expected if s not in found]

    sections = {
        'contact info': bool(re.search(r'[\w.+-]+@[\w-]+\.[\w.]+', text)),
        'skills section': 'skill' in lower,
        'education': any(k in lower for k in ['education', 'university', 'college', 'bachelor', 'b.tech', 'degree']),
        'experience/projects': any(k in lower for k in ['experience', 'project', 'internship', 'work history']),
        'summary/objective': any(k in lower for k in ['summary', 'objective', 'profile']),
    }
    quantified = len(re.findall(r'\d+\s*%|\$\s*\d+|\d+\+?\s*(users|customers|hours|days|weeks|projects|team)', lower))
    verbs = [v for v in ACTION_VERBS if v in lower]

    score = 30
    score += sum(8 for present in sections.values() if present)
    score += min(12, len(found))
    score += min(8, quantified * 2)
    score += min(6, len(verbs))
    if 250 <= len(words) <= 1100:
        score += 6
    score = max(15, min(92, score))

    ats = 40
    ats += 15 if sections['contact info'] else 0
    ats += 15 if sections['skills section'] else 0
    ats += 10 if sections['education'] else 0
    ats += 10 if 250 <= len(words) <= 1100 else 0
    ats += 10 if len(found) >= 5 else 0
    ats = min(95, ats)

    improvements = []
    if not sections['contact info']:
        improvements.append('Add a professional email address (and phone/LinkedIn) at the top.')
    if not sections['summary/objective']:
        improvements.append('Add a 2-3 line professional summary tailored to the target role.')
    if quantified == 0:
        improvements.append('Quantify achievements: numbers, percentages, and scale (e.g. "cut load time by 40%").')
    if len(verbs) < 3:
        improvements.append('Start bullet points with strong action verbs (built, led, optimized, delivered).')
    if missing:
        improvements.append(f'Consider adding or learning: {", ".join(missing[:4])} — common for {target_role} roles.')
    if len(words) < 250:
        improvements.append('Your resume looks thin — expand projects and experience with specific details.')
    if len(words) > 1100:
        improvements.append('Trim to one page (or two max): recruiters skim, so cut older or irrelevant items.')
    if not improvements:
        improvements.append('Tailor the resume keywords to each job description before applying.')

    formatting = []
    if len(words) > 1100:
        formatting.append('Resume may be too long for ATS and recruiter skim-reading.')
    if not sections['skills section']:
        formatting.append('No dedicated skills section found — ATS parsers look for one.')
    if '\t' in text:
        formatting.append('Tab characters detected — use simple single-column layout for ATS safety.')

    return {
        'overall_score': score,
        'ats_score': ats,
        'skills_found': found[:15],
        'missing_skills': missing,
        'education_feedback': 'Education section detected with relevant details.' if sections['education']
            else 'No clear education section found — add your degree, institution, and graduation year.',
        'experience_feedback': f'Found {quantified} quantified result(s) and {len(verbs)} action verbs. '
            + ('Good evidence of impact.' if quantified >= 3 else 'Add more measurable outcomes to your experience bullets.'),
        'grammar_issues': [],
        'formatting_issues': formatting,
        'improvements': improvements[:7],
        'improved_summary': f'Motivated {target_role} with hands-on experience in {", ".join(found[:4]) or 'your core stack'}. '
            'Proven ability to deliver results in team environments. Seeking to contribute skills and grow further.',
        'strengths': ([f'Good technical keyword coverage ({len(found)} skills detected)'] if len(found) >= 5 else [])
            + (['Includes quantified achievements'] if quantified >= 2 else [])
            + (['Clear section structure'] if sum(sections.values()) >= 4 else []),
        'weaknesses': ([f'Missing role-relevant skills: {", ".join(missing[:3])}'] if missing else [])
            + (['Lacks measurable impact in experience bullets'] if quantified == 0 else []),
        'demo': True,
    }


def interview_question(config: dict, history: list, question_number: int, total: int) -> dict:
    itype = config['interview_type']
    difficulty = config['difficulty']
    role = config['role']
    company = config.get('company') or 'the company'
    seed = f'{itype}-{difficulty}-{role}-{question_number}-{len(history)}'

    if itype == 'hr':
        bank = HR_QUESTIONS[difficulty]
    elif itype == 'coding':
        bank = CODING_QUESTIONS[difficulty]
    elif itype == 'company':
        bank = [
            (f'Why do you want to join {company} specifically?', f'Research {company}\'s products, mission, and recent news; connect two specifics to your own goals and skills.', ['research', 'mission', 'fit']),
            (f'What do you know about {company}\'s products?', 'Name the main products/services, who uses them, and one thing you find impressive or would improve.', ['products', 'users', 'opinion']),
            (f'How do you see yourself contributing to {company} in your first 90 days?', 'A 30/60/90 plan: learn the codebase/domain, ship small wins, then own a meaningful project.', ['onboarding', 'impact', 'plan']),
            (f'{company} values ownership. Tell me about a time you took ownership.', 'STAR story where you went beyond your assignment, took responsibility for an outcome, and delivered.', ['ownership', 'responsibility', 'result']),
            (f'What questions do you have for us about {company}?', 'Ask 2-3 thoughtful questions about team challenges, success metrics, or engineering culture — never salary first.', ['questions', 'culture', 'curiosity']),
        ] + HR_QUESTIONS[difficulty][:2]
    else:
        bank = TECH_QUESTIONS[difficulty]
        if question_number > 1 and question_number % 3 == 0:
            bank = BEHAVIORAL_QUESTIONS

    used = {h['question'] for h in history}
    available = [q for q in bank if q[0] not in used] or bank
    q, ideal, keywords = _pick(available, seed)[0]

    if history and question_number > 1:
        last = history[-1]
        last_words = [w for w in re.findall(r'[A-Za-z]{5,}', last['answer'])][:3]
        if last_words and itype in ('technical', 'coding'):
            q = f'You mentioned "{last_words[0]}" in your previous answer. {q}'

    category = {'hr': 'hr', 'coding': 'coding', 'company': 'hr', 'technical': 'technical'}[itype]
    return {'question': q, 'category': category, 'ideal_answer': ideal, 'keywords': keywords, 'demo': True}


def evaluate_answer(question: str, answer: str, config: dict, keywords: list) -> dict:
    words = answer.split()
    lower = answer.lower()
    word_count = len(words)

    matched = [k for k in keywords if k.lower() in lower]
    coverage = len(matched) / max(1, len(keywords))

    structure_signals = len(re.findall(r'for example|for instance|because|first|second|finally|result|situation|task|action', lower))
    fillers = sum(len(re.findall(r'\b' + re.escape(f) + r'\b', lower)) for f in FILLER_WORDS)

    relevance = 25 + coverage * 55 + min(20, word_count / 8)
    clarity = 70 + min(15, structure_signals * 4) - min(25, fillers * 4) - (20 if word_count < 10 else 0)
    depth = 20 + coverage * 40 + min(25, word_count / 6) + min(15, structure_signals * 3)
    if word_count < 5:
        relevance, clarity, depth = 10, 15, 5

    clamp = lambda v: max(0, min(95, int(v)))
    relevance, clarity, depth = clamp(relevance), clamp(clarity), clamp(depth)
    overall = int(relevance * 0.4 + clarity * 0.25 + depth * 0.35)

    feedback_parts = []
    if word_count < 15:
        feedback_parts.append('Your answer is very short — interviewers expect specifics, examples, and reasoning.')
    if coverage < 0.5 and keywords:
        feedback_parts.append(f'Try to address key concepts such as: {", ".join(keywords[:3])}.')
    elif coverage >= 0.5:
        feedback_parts.append(f'Good — you covered {", ".join(matched[:3])}.')
    if structure_signals == 0 and word_count >= 15:
        feedback_parts.append('Structure your answer (e.g. STAR for behavioral questions, or approach → trade-offs → example for technical ones).')
    if fillers >= 3:
        feedback_parts.append(f'You used {fillers} filler words — pause silently instead of saying "um" or "like".')
    if not feedback_parts:
        feedback_parts.append('Solid answer. Add a concrete example from your experience to make it even stronger.')

    return {
        'relevance_score': relevance,
        'clarity_score': clarity,
        'depth_score': depth,
        'overall_score': overall,
        'feedback': ' '.join(feedback_parts),
        'suggested_answer': '',
        'demo': True,
    }


def interview_report(config: dict, qa_pairs: list) -> dict:
    scores = [qa.get('overall_score', 0) for qa in qa_pairs]
    overall = int(sum(scores) / max(1, len(scores)))
    avg_clarity = sum(qa.get('clarity_score', 0) for qa in qa_pairs) / max(1, len(qa_pairs))
    avg_depth = sum(qa.get('depth_score', 0) for qa in qa_pairs) / max(1, len(qa_pairs))
    avg_relevance = sum(qa.get('relevance_score', 0) for qa in qa_pairs) / max(1, len(qa_pairs))

    strengths, weaknesses, suggestions = [], [], []
    if avg_clarity >= 65:
        strengths.append('Communicates clearly and structures answers well.')
    else:
        weaknesses.append('Answers need clearer structure.')
        suggestions.append('Practice the STAR method for behavioral questions and approach-first framing for technical ones.')
    if avg_depth >= 65:
        strengths.append('Provides good technical depth and specifics.')
    else:
        weaknesses.append('Answers often stay on the surface.')
        suggestions.append('Prepare 3-4 deep project stories with metrics, trade-offs, and lessons learned.')
    if avg_relevance >= 65:
        strengths.append('Stays focused on what was asked.')
    else:
        weaknesses.append('Some answers drift from the question.')
        suggestions.append('Pause for 2 seconds, restate the question mentally, then answer directly.')
    if overall >= 75:
        strengths.append('Overall interview-ready performance.')
        recommendation = 'yes — strong performance with minor polish needed'
    elif overall >= 55:
        recommendation = 'maybe — promising, but needs more preparation'
        suggestions.append('Do 2-3 more mock interviews focusing on your weakest category.')
    else:
        recommendation = 'not yet — keep practicing, you will get there'
        suggestions.append('Start with beginner-level interviews and review the suggested answers after each session.')

    return {
        'overall_score': overall,
        'summary': f'You completed {len(qa_pairs)} questions in this {config["interview_type"]} interview '
            f'({config["difficulty"]} level) for {config["role"]}. Your average score was {overall}/100. '
            + ('You are performing well — keep refining depth and examples.' if overall >= 60
               else 'Focus on the suggestions below and practice consistently; scores improve quickly with repetition.'),
        'strengths': strengths,
        'weaknesses': weaknesses,
        'suggestions': suggestions,
        'category_breakdown': {
            'technical': int(avg_depth), 'communication': int(avg_clarity),
            'problem_solving': int(avg_relevance), 'confidence': int((avg_clarity + overall) / 2),
        },
        'hiring_recommendation': recommendation,
        'demo': True,
    }


def _grammar_check(text: str) -> list:
    corrections = []
    checks = [
        (r'\bi\b', 'I', 'The pronoun "I" is always capitalized.'),
        (r'\bcould of\b', 'could have', 'Use "could have", not "could of".'),
        (r'\bshould of\b', 'should have', 'Use "should have", not "should of".'),
        (r'\bdont\b', "don't", 'Contractions need an apostrophe.'),
        (r'\bcant\b', "can't", 'Contractions need an apostrophe.'),
        (r'\bwont\b', "won't", 'Contractions need an apostrophe.'),
        (r'\bim\b', "I'm", 'Write "I\'m" with capital I and apostrophe.'),
        (r'\balot\b', 'a lot', '"A lot" is two words.'),
    ]
    for pattern, fix, explanation in checks:
        match = re.search(pattern, text)
        if match:
            corrections.append({'original': match.group(0), 'corrected': fix, 'explanation': explanation})
    return corrections[:3]


def voice_opening(mode: str, topic: str) -> dict:
    openings = {
        'conversation': "Hi! I'm PrepPilot, your communication coach. Let's have a natural conversation. To start — tell me about your day so far.",
        'english_practice': "Welcome to English practice! Speak freely and I'll help you improve. Let's begin: describe what you did yesterday, in a few sentences.",
        'interview_simulation': "Hello, thanks for joining today. I'm your interviewer. Let's start simple: tell me about yourself and what kind of role you're preparing for.",
        'daily_exercise': f"Welcome to today's speaking exercise! Your topic: {topic or _todays_topic()}. Take a breath and speak for about a minute whenever you're ready.",
        'topic_challenge': f"Topic challenge! Your random topic is: {topic or _todays_topic()}. Speak about it for 60-90 seconds — I'll give you feedback after.",
    }
    return {'reply': openings.get(mode, openings['conversation']), 'grammar_corrections': [], 'fluency_note': '', 'demo': True}


def voice_reply(mode: str, topic: str, history: list, user_text: str) -> dict:
    corrections = _grammar_check(user_text)
    user_turns = sum(1 for m in history if m['speaker'] == 'user')
    words = len(user_text.split())

    if words < 8:
        reply = "That's a start! Try to expand — can you give me more detail or an example? The more you speak, the faster you improve."
    elif mode == 'interview_simulation':
        followups = [
            'Interesting. Can you walk me through a specific example of that?',
            'Good. What would you say is the biggest challenge there, and how did you handle it?',
            'I see. How does that experience connect to the role you want?',
            'Nice. Tell me more — what was the outcome, and what did you learn?',
            'Thanks for sharing. Why should a team want to work with you?',
        ]
        reply = followups[user_turns % len(followups)]
    elif mode in ('daily_exercise', 'topic_challenge'):
        reply = _pick([
            'Good effort! Now push further: what is one more detail or example you can add?',
            'Nice. Try restating your main point in one clear sentence, then support it with a reason.',
            'Well done. Now tell me the opposite perspective — what would someone who disagrees say?',
            'Great practice. Summarize what you just said in two sentences, as if wrapping up an interview answer.',
        ], f'{user_turns}-{len(history)}')[0]
    else:
        reply = _pick([
            "That's interesting! Tell me more about that — what happened next?",
            'Nice, I like the detail. How did that make you feel, and why?',
            'Good. Can you explain that in a slightly different way, as if to someone new to the topic?',
            'Thanks for sharing! What do you think is the most important part of what you just said?',
            'Great. Let\'s go deeper — what would you do differently next time?',
        ], f'{user_turns}-{len(history)}')[0]

    note = 'Good flow — keep your sentences connected.' if words >= 25 else 'Try to speak in fuller sentences.'
    if corrections:
        note = f'Small fix: say "{corrections[0]["corrected"]}" instead of "{corrections[0]["original"]}". ' + note
    return {'reply': reply, 'grammar_corrections': corrections, 'fluency_note': note, 'demo': True}


def communication_report(messages: list, metrics: dict) -> dict:
    user_texts = [m['text'] for m in messages if m['speaker'] == 'user']
    all_text = ' '.join(user_texts)
    words = all_text.split()
    word_count = len(words)
    duration = max(1, metrics.get('total_duration_seconds', 1))
    wpm = metrics.get('avg_wpm') or (word_count / duration * 60)
    fillers = metrics.get('total_fillers', sum(len(re.findall(r'\b' + re.escape(f) + r'\b', all_text.lower())) for f in FILLER_WORDS))
    stt_conf = metrics.get('avg_stt_confidence')
    unique_ratio = len({w.lower() for w in words}) / max(1, word_count)
    corrections = _grammar_check(all_text)

    fluency = 75
    if wpm < 90:
        fluency -= 20
    elif wpm > 190:
        fluency -= 15
    fluency -= min(25, fillers * 3)
    fluency += 10 if word_count > 150 else 0

    grammar = max(30, 90 - len(corrections) * 12)
    pronunciation = int(stt_conf * 100) if stt_conf else 70
    confidence = 70 + (10 if word_count > 100 else -10) - min(20, fillers * 2)
    vocabulary = int(40 + unique_ratio * 60)

    clamp = lambda v: max(0, min(95, int(v)))
    fluency, grammar, pronunciation, confidence, vocabulary = map(clamp, (fluency, grammar, pronunciation, confidence, vocabulary))
    overall = int(fluency * .25 + grammar * .2 + pronunciation * .15 + confidence * .2 + vocabulary * .2)

    strengths, improvements = [], []
    if 100 <= wpm <= 170:
        strengths.append(f'Good speaking pace (~{int(wpm)} words per minute).')
    else:
        improvements.append(f'Your pace was ~{int(wpm)} wpm — aim for 120-160, pausing between ideas.')
    if fillers <= 2:
        strengths.append('Very few filler words — you sound composed.')
    else:
        improvements.append(f'Reduce filler words ({fillers} detected). Pause silently instead.')
    if unique_ratio > 0.6:
        strengths.append('Varied vocabulary.')
    else:
        improvements.append('Vary your word choice — avoid repeating the same phrases.')
    if corrections:
        improvements.append(f'Grammar fixes: {corrections[0]["original"]} → {corrections[0]["corrected"]}.')
    if word_count < 60:
        improvements.append('Speak more per turn — longer answers build fluency faster.')

    return {
        'fluency_score': fluency, 'grammar_score': grammar,
        'pronunciation_score': pronunciation, 'confidence_score': confidence,
        'vocabulary_score': vocabulary, 'overall_score': overall,
        'strengths': strengths, 'improvements': improvements,
        'grammar_corrections': corrections,
        'detailed_feedback': f'You spoke {word_count} words across {len(user_texts)} turns at about {int(wpm)} wpm. '
            + ('Your communication is developing well — keep practicing daily.' if overall >= 60
               else 'Focus on the improvements below; short daily sessions produce fast gains.')
            + ' Pronunciation score is estimated from speech-recognition confidence.',
        'demo': True,
    }


def _todays_topic() -> str:
    idx = int(hashlib.md5(date.today().isoformat().encode()).hexdigest(), 16) % len(VOICE_TOPICS)
    return VOICE_TOPICS[idx]


def daily_exercises() -> dict:
    idx = int(hashlib.md5(date.today().isoformat().encode()).hexdigest(), 16) % len(DAILY_EXERCISES)
    rng = random.Random(date.today().isoformat())
    return {
        'daily_exercise': DAILY_EXERCISES[idx],
        'topics': rng.sample(VOICE_TOPICS, 5),
        'demo': True,
    }


def roadmap(target_role: str, duration_weeks: int, experience_level: str) -> dict:
    bucket = _role_bucket(target_role)
    focus = {
        'software': ['data structures & algorithms', 'your primary language deeply', 'system design basics', 'a full-stack project', 'Git & testing'],
        'data': ['Python & pandas', 'SQL & databases', 'statistics & ML fundamentals', 'an end-to-end data project', 'visualization & storytelling'],
        'frontend': ['HTML/CSS/JavaScript fundamentals', 'React deeply', 'state management & APIs', 'a polished portfolio project', 'testing & accessibility'],
        'default': ['core role fundamentals', 'tools used in the industry', 'a portfolio project', 'communication skills', 'interview techniques'],
    }[bucket]

    tasks = []
    for week in range(1, duration_weeks + 1):
        phase = (week - 1) / max(1, duration_weeks - 1)
        if phase < 0.35:
            theme, priority = f'Fundamentals: {focus[0]}', 'high'
            items = [
                (f'Study {focus[0]}', f'Build a strong foundation in {focus[0]}. Use official docs and solve beginner practice problems daily.', 6),
                (f'Practice {focus[1]}', f'Deepen {focus[1]} with hands-on exercises; write code or notes every day.', 5),
                ('Solve 5 practice problems', 'Apply what you learned to small problems; explain your reasoning out loud.', 3),
                ('Update your resume', 'Add what you learned this week; keep it ATS-friendly.', 1),
            ]
        elif phase < 0.7:
            theme, priority = f'Build: {focus[3]}', 'high'
            items = [
                (f'Work on {focus[3]}', f'Make steady progress on {focus[3]} — this becomes your interview story.', 8),
                (f'Learn {focus[2]}', f'Study {focus[2]} and apply it to your project.', 4),
                ('Do one mock interview', 'Practice a full mock interview on PrepPilot and review the feedback.', 1),
                ('Daily speaking practice', 'Spend 10 minutes with the Voice Coach explaining what you built.', 1),
            ]
        else:
            theme, priority = 'Interview readiness', 'high'
            items = [
                ('Take 2 mock interviews', 'Simulate real pressure: technical + HR rounds. Review every suggestion.', 2),
                ('Prepare your STAR stories', 'Write and rehearse 4 stories: challenge, failure, leadership, teamwork.', 3),
                ('Review core concepts', f'Revise {focus[0]} and {focus[2]}; teach them aloud to test understanding.', 4),
                ('Apply to 5 roles', 'Tailor your resume per application and track responses.', 2),
            ]
        for day, (title, desc, hours) in enumerate(items, start=1):
            tasks.append({
                'title': title, 'description': f'[{theme}] {desc}',
                'week_number': week, 'day_number': day,
                'priority': priority if day == 1 else 'medium',
                'estimated_hours': hours, 'resource_url': '',
            })
    return {'tasks': tasks, 'demo': True}


def practice_questions(category: str, difficulty: str, role: str, count: int) -> list:
    if category == 'hr':
        bank = HR_QUESTIONS.get(difficulty, HR_QUESTIONS['beginner'])
    elif category == 'coding':
        bank = CODING_QUESTIONS.get(difficulty, CODING_QUESTIONS['beginner'])
    elif category == 'behavioral':
        bank = BEHAVIORAL_QUESTIONS
    elif category == 'situational':
        bank = BEHAVIORAL_QUESTIONS
    else:
        bank = TECH_QUESTIONS.get(difficulty, TECH_QUESTIONS['beginner'])
    rng = random.Random(f'{category}-{difficulty}-{role}-{date.today().isoformat()}')
    picked = rng.sample(bank, min(count, len(bank)))
    return [
        {'question': q, 'category': category if category != 'situational' else 'behavioral',
         'ideal_answer': ideal, 'keywords': keywords}
        for q, ideal, keywords in picked
    ]


def resume_questions(text: str, count: int) -> list:
    lower = text.lower()
    found = [s for s in SKILL_BANK if s in lower]
    questions = []
    for skill in found[:count]:
        questions.append({
            'question': f'Your resume lists {skill}. Describe a project where you used it and the hardest problem you solved with it.',
            'focus_area': skill,
        })
    project_match = re.search(r'project[s]?[:\s]+([^\n]{10,120})', text, re.IGNORECASE)
    if project_match:
        questions.insert(0, {
            'question': f'Tell me about "{project_match.group(1).strip()[:80]}" — what was your role, the architecture, and the outcome?',
            'focus_area': 'listed project',
        })
    while len(questions) < min(count, 4):
        questions.append({'question': 'Walk me through the most challenging technical problem on your resume.', 'focus_area': 'general'})
    return questions[:count]