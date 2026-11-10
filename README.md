# PrepPilot AI

**AI-powered interview preparation platform** — practice mock interviews, analyze your resume, and train your speaking confidence with a real-time AI voice coach.

Built with React + TypeScript + Tailwind CSS on the frontend, Django + Django REST Framework on the backend, MySQL for storage, and Google Gemini for AI.

---

## Features

| Feature | What it does |
|---|---|
| **Authentication** | Email/password registration & login, Sign in with Google, JWT access/refresh tokens (rotation + blacklist), forgot/reset password, secure profiles |
| **AI Resume Analyzer** | PDF upload & text extraction, skill detection, missing-skill analysis, ATS score & feedback, concrete improvements, interview questions generated from your resume |
| **AI Mock Interview** | HR / Technical / Coding / Company-specific interviews, 3 difficulty levels, dynamic follow-up questions based on your answers, per-answer scoring, timer, full evaluation report with strengths, weaknesses & suggestions |
| **AI Voice & Confidence Coach** | Real-time spoken conversation: the AI interviewer speaks aloud (TTS), you answer with your microphone (STT). Grammar correction, fluency & pronunciation feedback, confidence scoring, daily exercises, random topic challenges, interview simulation |
| **Student Dashboard** | Interview counts & scores, communication score, resume score, 14-day score trend chart, daily goals, streaks, learning progress, recommendations, recent activity |
| **Practice Library** | Generate & browse practice questions by category/difficulty/role with ideal answers and keywords |
| **Learning Roadmaps** | AI-generated week-by-week study plans with trackable tasks and resources |
| **Interview History** | Every mock interview and voice session with scores and full reports |
| **Admin Dashboard** | Platform stats, signup trends, user management (activate/deactivate, roles) |
| **UI/UX** | Dark & light themes, responsive layouts, Framer Motion animations, charts, loading/error/empty states everywhere |

### Demo mode vs. real AI

- **No API key?** The platform runs in clearly-labeled **demo mode**: heuristic engines produce realistic feedback so every feature is fully usable. Demo results are badged in the UI.
- **Gemini key configured?** All AI features switch to **real Google Gemini responses** automatically. The app never substitutes fake responses when a real API is configured.

---

## Tech Stack

- **Frontend:** React 18, TypeScript (strict), Vite 5, Tailwind CSS 3, Framer Motion, Recharts, Headless UI, Heroicons, Axios, Web Speech API (STT/TTS)
- **Backend:** Python 3.10–3.13, Django 5.2 LTS, Django REST Framework, SimpleJWT, django-cors-headers, WhiteNoise
- **Database:** MySQL 8+ (utf8mb4)
- **AI:** Google Gemini (`gemini-2.5-flash` by default) via REST
- **Voice:** Browser SpeechRecognition + SpeechSynthesis (Chrome/Edge recommended)

## Project Structure

```
├── backend/
│   ├── config/          # Django settings, URLs, WSGI/ASGI
│   ├── accounts/        # Custom user model, JWT auth, Google sign-in, password reset
│   ├── profiles/        # Student profiles (avatar, skills, target role…)
│   ├── resumes/         # PDF upload, extraction, analysis history
│   ├── interviews/      # Mock interview sessions, questions, answers, practice library
│   ├── voice_coach/     # Voice sessions, messages, communication reports, exercises
│   ├── roadmaps/        # Learning roadmaps & tasks
│   ├── analytics/       # Student dashboard, admin stats & user management
│   ├── ai_engine/       # Gemini client, prompts, demo engines, service-status endpoint
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── pages/       # 12+ pages (landing, auth, dashboard, interview, voice…)
    │   ├── components/  # UI primitives, layout, feature components
    │   ├── services/    # Typed API clients (one per backend app)
    │   ├── context/     # Auth, Theme, ServiceConfig providers
    │   ├── hooks/       # useAuth, useSpeech (STT/TTS)
    │   ├── types/       # Shared API types mirroring the backend
    │   └── utils/       # Helpers & constants
    └── .env.example
```

---

## Prerequisites

- **Python 3.10–3.13** (3.13 recommended; 3.14 is not yet supported by some dependencies)
- **Node.js 18+** and npm
- **MySQL 8+** running locally (or reachable over the network)
- macOS/Linux build tools for `mysqlclient`:
  - **macOS:** `brew install mysql pkgconf`
  - **Debian/Ubuntu:** `sudo apt install python3-dev default-libmysqlclient-dev build-essential pkg-config`

## 1. Database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS preppilot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

## 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then edit .env (see table below)

python manage.py migrate
python manage.py createsuperuser   # admin login for /admin and the Admin Dashboard
python manage.py runserver 0.0.0.0:8000
```

API base: `http://localhost:8000/api/` · Django admin: `http://localhost:8000/admin/`

### Backend environment variables (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `SECRET_KEY` | — | Django secret. Generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DEBUG` | `True` | Set `False` in production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Comma-separated hosts |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | `preppilot_db` / `root` / empty / `localhost` / `3306` | MySQL connection |
| `GEMINI_API_KEY` | empty | **Leave empty for demo mode.** Get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) to enable real AI |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Any Gemini model supporting JSON output |
| `AI_DEMO_MODE` | `True` | Allow demo fallback when no key is set |
| `GOOGLE_CLIENT_ID` | empty | Google OAuth Web client ID (see below) |
| `JWT_ACCESS_TOKEN_LIFETIME_HOURS` | `1` | Access token lifetime |
| `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | `7` | Refresh token lifetime |
| `FRONTEND_URL` | `http://localhost:5173` | Used in password-reset links |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_HOST_USER` / `EMAIL_HOST_PASSWORD` | SMTP defaults | Real email in production. **In DEBUG, reset links print to the runserver console instead.** |
| `MAX_UPLOAD_SIZE_MB` | `5` | Resume PDF size limit |

## 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env            # leave VITE_API_URL empty for local dev
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` → `http://localhost:8000`, so no CORS setup is needed in development. Set `VITE_API_URL` only when the API lives on another origin.

Production build: `npm run build` (outputs `frontend/dist/`).

---

## Optional integrations

### Google Gemini (real AI)

1. Create a free API key at <https://aistudio.google.com/apikey>.
2. Set `GEMINI_API_KEY=...` in `backend/.env` and restart Django.
3. The UI banner switches from "Demo mode" to connected; all AI features now use Gemini. Keys stay server-side in environment variables — never in frontend code.

### Sign in with Google

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) create an **OAuth 2.0 Client ID** of type **Web application**.
2. Add authorized JavaScript origins: `http://localhost:5173` (and your production origin).
3. Set `GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com` in `backend/.env` and restart Django.
4. The Google button appears automatically on login/register (the frontend reads configuration from `/api/config/`). No client secret is needed — the backend verifies the Google ID token directly.

### Password reset in development

With `DEBUG=True`, emails use Django's console backend: request a reset from the login page, then copy the link printed in the **Django runserver terminal** (`http://localhost:5173/reset-password/<uid>/<token>/`). For real email, set `DEBUG=False` and fill the `EMAIL_*` variables (e.g. a Gmail app password).

### Voice coach browser support

- **Chrome or Edge** recommended (SpeechRecognition + SpeechSynthesis).
- Microphone permission is requested on first record; allow it.
- Firefox has no speech recognition — the coach gracefully falls back to typed answers.
- Speech recognition requires a network connection and a secure context (`localhost` counts).

---

## API Overview

All endpoints are under `/api/`. Auth via `Authorization: Bearer <access>`; refresh at `/api/auth/token/refresh/`.

| Area | Endpoints |
|---|---|
| Config | `GET /api/config/` (AI/OAuth status, upload limit) |
| Auth | `register/`, `login/`, `logout/`, `google/`, `me/`, `token/refresh/`, `change-password/`, `password-reset/`, `password-reset/confirm/` |
| Profile | `GET/PATCH /api/profile/` |
| Resumes | `upload/`, list/detail/delete, `<id>/analyze/`, `<id>/questions/`, `analyses/` |
| Interviews | `sessions/` (list/create), `sessions/<id>/` (detail), `…/answer/`, `…/complete/`, `…/abandon/`, `practice/`, `practice/generate/` |
| Voice | `sessions/` (list/create), `sessions/<id>/`, `…/message/`, `…/complete/`, `…/abandon/`, `exercises/` |
| Roadmaps | `generate/`, list/detail/delete, `<id>/tasks/<task_id>/` |
| Analytics | `dashboard/`, `admin/`, `admin/users/`, `admin/users/<id>/` (admin only) |

Rate limits: 60/min anonymous, 240/min authenticated, 30/min on AI generation endpoints.

## Admin access

Create a superuser (`python manage.py createsuperuser`) and log in — superusers and users with `role=admin` see the **Admin Dashboard** in the app sidebar, plus the classic Django admin at `:8000/admin/`.

---

## Production notes

- `DEBUG=False`, strong `SECRET_KEY`, proper `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`.
- Serve Django with Gunicorn: `gunicorn config.wsgi:application --bind 0.0.0.0:8000` (WhiteNoise serves static files; run `python manage.py collectstatic` first).
- Serve `frontend/dist` from any static host/CDN; set `VITE_API_URL` to your API origin at build time.
- Configure real SMTP for password-reset emails; use HTTPS (security headers/secure cookies enable automatically when `DEBUG=False`).
- Use a dedicated MySQL user (not root) with access only to `preppilot_db`.

## Troubleshooting

| Problem | Fix |
|---|---|
| `mysqlclient` fails to build | Install MySQL client libraries + pkg-config (see Prerequisites), then retry `pip install -r requirements.txt` |
| `PyMuPDF` fails to build on older macOS | The pin `>=1.26.3,<1.27` provides x86_64 wheels; don't unpin it |
| Frontend can't reach API | Ensure Django runs on `:8000`; keep `VITE_API_URL` empty in dev so the Vite proxy is used |
| Google button missing | Set `GOOGLE_CLIENT_ID` in `backend/.env` and restart Django |
| Mic button missing / STT unsupported | Use Chrome/Edge; allow microphone permission; typed fallback is always available |
| AI requests return 503 | Gemini key invalid/quota exceeded — check the key or unset it to return to demo mode |
| Reset email never arrives | In DEBUG it prints to the Django console, not to an inbox |