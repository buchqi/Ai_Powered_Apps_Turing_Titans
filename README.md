# 🎬 Film Adviser — AI-Powered Movie Recommendations for Couples

**Team:** Turing Titans  
**Course:** CS-AI-2026 — Building AI-Powered Applications  
**University:** Kutaisi International University · Spring 2026

[![CI](https://github.com/buchqi/Ai_Powered_Apps_Turing_Titans/actions/workflows/ci.yml/badge.svg)](https://github.com/buchqi/Ai_Powered_Apps_Turing_Titans/actions/workflows/ci.yml)

---

## Overview

Film Adviser eliminates the "what should we watch tonight?" problem for couples and friends. Each person answers five questions about their current mood and preferences. An AI engine merges both profiles, retrieves candidates from a curated movie database, scores them for fairness, and returns a ranked list with plain-English explanations — all in under three seconds.

**The core insight:** most recommendation systems optimise for one user. Film Adviser explicitly models two preference profiles and penalises results that over-fit either one.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  React + Vite + Tailwind CSS + Framer Motion                │
│  Auth (JWT) · Swipe UI · Watchlist · Account                │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / JSON
┌──────────────────────▼──────────────────────────────────────┐
│                   FastAPI Backend                           │
│                                                             │
│  /auth/*          — JWT register / login / me              │
│  /recommend/*     — session-based AI pipeline              │
│  /users/*         — authenticated watchlist & sessions     │
│  /health          — sub-500 ms ops gate                    │
│                                                             │
│  ┌──────────────┐   ┌────────────────┐   ┌─────────────┐  │
│  │  RAG Service │   │   AI Service   │   │ Rec Service │  │
│  │  ChromaDB    │──▶│ Gemini Flash   │──▶│  Scoring +  │  │
│  │  Embeddings  │   │ (+ fallback)   │   │  Fairness   │  │
│  └──────────────┘   └────────────────┘   └─────────────┘  │
│                                                             │
│  SQLite / PostgreSQL (Alembic migrations)                   │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python 3.11), Uvicorn |
| AI Model | Gemini Flash (primary) · deterministic fallback |
| Vector DB | ChromaDB + sentence-transformers embeddings |
| Database | SQLite (dev) · PostgreSQL (prod via Alembic) |
| Auth | JWT (python-jose) · bcrypt password hashing |
| CI/CD | GitHub Actions |
| Deployment | Railway (backend) · Vercel (frontend) |

### Request Flow

```
User A + User B answer preferences
        ↓
POST /recommend/session
        ↓
RAG retrieves 50 candidate films from ChromaDB
        ↓
Four deterministic filters (genre, runtime, dealbreakers, diversity)
        ↓
Gemini Flash scores each film for User A, User B, and fairness
        ↓
Fallback: deterministic average if AI fails or times out
        ↓
Top 10 scored films returned as swipeable cards
```

---

## Quick Start (one command)

```bash
git clone https://github.com/buchqi/Ai_Powered_Apps_Turing_Titans.git
cd Ai_Powered_Apps_Turing_Titans
cp .env.example .env          # add your GEMINI_API_KEY and TMDB_API_KEY
chmod +x setup.sh && ./setup.sh
```

Opens at **http://localhost:3000**. Backend API at **http://localhost:8000/docs**.

> The app runs without API keys — AI explanations fall back to deterministic scoring and recommendations still work.

### Docker deployment

Run the full local stack:

```bash
docker compose up --build
```

Run it in the background:

```bash
docker compose up --build -d
```

Check service status:

```bash
docker compose ps
```

Health check:

```bash
curl http://localhost:8000/health
```

Recommendation smoke test:

```bash
curl -X POST http://localhost:8000/recommend/session \
  -H "Content-Type: application/json" \
  -d '{"preferences":{"userA":{"vibe":"warm romantic date night","brainpower":"light","reality":"fictional","action":"low action","dealbreaker":"no horror"},"userB":{"vibe":"funny heartfelt adventure","brainpower":"medium","reality":"fictional","action":"some action","dealbreaker":"no gore"}},"batch_size":2}'
```

PowerShell smoke test:

```powershell
$body = @{
  preferences = @{
    userA = @{
      vibe = "warm romantic date night"
      brainpower = "light"
      reality = "fictional"
      action = "low action"
      dealbreaker = "no horror"
    }
    userB = @{
      vibe = "funny heartfelt adventure"
      brainpower = "medium"
      reality = "fictional"
      action = "some action"
      dealbreaker = "no gore"
    }
  }
  batch_size = 2
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:8000/recommend/session" -Method POST -ContentType "application/json" -Body $body
```

The backend Dockerfile binds Uvicorn to `0.0.0.0` and uses Railway's `PORT` variable with a local fallback to `8000`. The backend build context excludes `.env`, caches, virtualenvs, logs, tests, and compiled Python files through `backend/.dockerignore`.

### Railway backend deployment

Deploy the backend as a Railway service from this repository:

1. Create a new Railway project from the GitHub repository.
2. Set the service root directory to `backend`.
3. Use Dockerfile deployment. Railway should detect `backend/Dockerfile`.
4. Add a Railway PostgreSQL database, or set `DATABASE_URL` manually.
5. Set the required environment variables listed below.
6. Set the health check path to `/health`.
7. Deploy and verify `https://<railway-backend-domain>/health`.
8. Run the recommendation smoke test against the Railway backend URL.

Required backend environment variables:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Railway PostgreSQL URL recommended. SQLite is fine only for local Docker smoke tests. |
| `SECRET_KEY` | Yes | Use a long random value, for example `python -c "import secrets; print(secrets.token_hex(32))"`. |
| `GEMINI_API_KEY` | No | Enables AI explanations. Without it, deterministic fallback still returns recommendations. |
| `TMDB_API_KEY` | No | Used by poster-fetch tooling; existing poster URLs still work without it. |
| `PORT` | Provided by Railway | Do not hardcode it. The Dockerfile uses `${PORT:-8000}`. |

Frontend deployment:

1. Deploy the frontend separately, for example to Vercel, Netlify, or another Railway service.
2. Set `VITE_API_URL` to the public backend URL, for example `https://<railway-backend-domain>`.
3. Rebuild the frontend after changing `VITE_API_URL`, because Vite embeds it at build time.

### Manual setup (no Docker)

```bash
# Backend
cd backend
python -m venv ../venv && source ../venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload      # http://localhost:8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite path or PostgreSQL URL |
| `SECRET_KEY` | Yes | JWT signing key — generate with `python -c "import secrets; print(secrets.token_hex(32))"` |
| `GEMINI_API_KEY` | No* | AI recommendations — fallback used if absent |
| `TMDB_API_KEY` | No* | Fetches real movie posters |

---

## Evaluation Results

Golden set: **10 / 10 cases passed (100%)** — run `2026-05-13`.

| Case | Scenario | Result | Films returned |
|---|---|---|---|
| G01 | Romantic date night, no horror | ✅ PASS | 10 |
| G02 | Sci-fi + drama crossover | ✅ PASS | 10 |
| G03 | Short film (< 100 min) | ✅ PASS | 4 |
| G04 | Family-friendly animated | ✅ PASS | 10 |
| G05 | Thriller, excluding gore | ✅ PASS | 10 |
| G06 | Comedy for tired evening | ✅ PASS | 10 |
| G07 | High-rated classic | ✅ PASS | 10 |
| G08 | Recent action movie | ✅ PASS | 10 |
| G09 | Emotional drama, not bleak | ✅ PASS | 10 |
| G10 | Balanced compromise, conflicting tastes | ✅ PASS | 10 |

**Latency** (109 successful AI calls from episode logs):

| Metric | Value |
|---|---|
| Average | 1 363 ms |
| Median (P50) | 1 377 ms |
| Maximum | 2 319 ms |
| All calls under 3 000 ms | 100% |
| `/health` endpoint | < 50 ms |

**Reliability:**

| Metric | Value |
|---|---|
| AI success rate | 7% (model quota limited during eval) |
| Fallback success rate | 100% |
| Combined uptime | 100% — no request returned an error |

---

## Cost Analysis

Model: **Gemini Flash** via Google AI API.  
Pricing used in `backend/utils/cost_calculator.py`:

| Token type | Price |
|---|---|
| Input | $0.000005 / token |
| Output | $0.000015 / token |

**Per session** (based on 109 real AI calls, avg 368 tokens total):

| Calls per session | Estimated cost |
|---|---|
| 1 recommendation batch | ~$0.0025 |
| 3 batches (full evening) | ~$0.0075 |

**At scale:**

| Monthly sessions | Monthly cost |
|---|---|
| 1 000 | $2.50 |
| 10 000 | $25.00 |
| 100 000 | $250.00 |

Cost is negligible at student-project scale. The deterministic fallback means the app continues working at zero AI cost when quota runs out.

---

## Project Structure

```
Ai_Powered_Apps_Turing_Titans/
├── frontend/                  # React + Vite SPA
│   ├── src/
│   │   ├── api/               # HTTP clients (auth, watchlist, recommendations)
│   │   ├── components/        # Navbar, MovieCard, MovieSwiper, PreferenceCard
│   │   ├── context/           # AuthContext (JWT)
│   │   ├── lib/               # token-storage
│   │   └── pages/             # Landing, Login, Signup, Home, Watchlist,
│   │                          #   About, Account, Settings
│   └── Dockerfile
├── backend/                   # FastAPI application
│   ├── api/                   # Route handlers (auth, user_recommendations,
│   │                          #   user_watchlist)
│   ├── services/              # AI, RAG, recommendation, auth business logic
│   ├── models/                # SQLAlchemy ORM models
│   ├── schemas/               # Pydantic request/response schemas
│   ├── core/                  # Config, security helpers
│   ├── alembic/               # Database migrations
│   ├── data/movies.json       # Curated movie dataset
│   ├── utils/                 # Cost calculator, episode logger, LLM resilience
│   ├── prompts/               # LLM prompt templates
│   └── Dockerfile
├── eval/                      # Golden set evaluation harness
│   ├── run_golden_set.py
│   └── results/               # Timestamped JSON results
├── logs/episode_logs.jsonl    # Per-request AI telemetry
├── docs/                      # Architecture, data flow, safety audit
├── .github/workflows/ci.yml   # CI pipeline
├── docker-compose.yml         # One-command local stack
├── setup.sh                   # One-command setup script
├── AGENTS.md                  # Agent architecture documentation
└── TEAM-CONTRACT.md
```

---

## Safety & Privacy

- Passwords hashed with bcrypt via `passlib`
- JWT tokens expire after 30 minutes
- No sensitive personal data stored
- AI receives only anonymised session-level preference data
- Structured prompt outputs reduce hallucination risk
- Fallback system prevents raw AI errors reaching users
- Full safety audit: `docs/safety-audit.md`

---

## Team

| Name | Role | GitHub |
|---|---|---|
| Giorgi Tkebuchava | Backend & AI Integration | [@buchqi](https://github.com/buchqi) |
| Gela Lomidze | Frontend & UI | [@gelalomidze](https://github.com/gelalomidze) |
| Ivane Urjumelashvili | Database & Data Governance | [@ivaneu](https://github.com/ivaneu) |

---

© 2026 Turing Titans · Film Adviser. All rights reserved.  
CS-AI-2026 · Kutaisi International University
