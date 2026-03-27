# 🏗️ Architecture Design — Film Adviser

## Architecture Diagram Description

_(In submission, this section corresponds to `design-review/architecture-diagram.png`)_

### Components in the diagram:

[User's Browser (React + Tailwind, Vercel)]
|
| HTTPS (preferences, swipe data, "Find Movie" request)
v
[FastAPI Backend — Railway, EU region]
| |
| JSON (preferences + | SQL queries (user data,
| candidate movies) | history, swipe data)
v v
[OpenAI GPT-4.1-mini [Supabase Postgres (EU)]
via OpenRouter] (stores users, preferences,
| swipe history, fairness logs)
|
JSON response
v
[FastAPI Backend]
|
formatted recommendations (JSON)
v
[User's Browser — swipe UI (Tinder-style cards)]

---

## Key Features of This Architecture

- **Frontend is clearly labelled:**  
  "User's Browser (React + Tailwind, Vercel)"

- **Backend is specified with technology and hosting:**  
  "FastAPI Backend — Railway, EU region"

- **AI model is explicitly named:**  
  "OpenAI GPT-4.1-mini via OpenRouter" (not just "AI")

- **Storage is clearly defined:**  
  "Supabase Postgres (EU)" storing:
  - User profiles
  - Individual preferences
  - Swipe history (likes/dislikes)
  - Fairness tracking data

- **Arrows show direction of data flow** between all components

- **Separation of responsibilities:**
  - Frontend → UI and interaction (swiping, input)
  - Backend → logic, scoring orchestration
  - AI → recommendation scoring + explanations
  - Database → persistent user and interaction data

---

## Technology Stack

| Layer            | Technology                            | Why                                                                         |
| ---------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| Frontend         | React + Tailwind (Vercel)             | Fast UI development, easy deployment, ideal for interactive swipe interface |
| Backend          | FastAPI (Python) on Railway           | Team familiarity, fast API development, good for AI integration             |
| Primary AI model | OpenAI GPT-4.1-mini via OpenRouter    | Cheap, fast, good for structured JSON output and reasoning                  |
| Secondary model  | Gemini 3 Flash via OpenRouter         | Easy fallback by changing model name                                        |
| Storage          | Supabase Postgres (EU)                | Free tier, structured relational data, supports user + couple logic         |
| External API     | TMDb API                              | Provides movie metadata (titles, genres, descriptions)                      |
| Hosting          | Vercel (frontend) + Railway (backend) | Free tiers, easy CI/CD, fast deployment                                     |

---

## Important Architectural Decisions

- **No movie data stored locally**  
  → All movie data is fetched dynamically from TMDb API  
  → Reduces storage complexity and keeps data up-to-date

- **User interaction data IS stored**  
  → Swipe actions (like/dislike)  
  → Preferences  
  → Fairness history  
  → Enables personalization and long-term learning

- **AI is not used for everything**  
  → Backend handles filtering and candidate selection  
  → AI focuses on:
  - Scoring
  - Fairness balancing
  - Explanation generation

- **Loose coupling with AI provider**  
  → Using OpenRouter allows easy model switching  
  → Only one config string change needed

---

## Diagram Reference

See: `design-review/architecture-diagram.png`
