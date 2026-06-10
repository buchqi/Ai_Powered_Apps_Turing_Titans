# AGENTS.md — Film Adviser Agent Architecture

**Project:** Film Adviser — AI-Powered Movie Recommendations  
**Team:** Turing Titans · CS-AI-2026 · Kutaisi International University

---

## Pattern: Orchestrated RAG Recommendation Agent

Film Adviser uses an **Orchestrated RAG (Retrieval-Augmented Generation) Agent** pattern rather than a fully autonomous agent. This was a deliberate design choice: the recommendation workflow is predictable and bounded, so a fixed orchestration pipeline gives better reliability, explainability, and safety than an open-ended agent loop.

The LLM is used only for scoring and explanation generation — it never decides what action to take next. The orchestrator always controls the pipeline.

---

## Agent State

```python
from dataclasses import dataclass, field

@dataclass
class AgentState:
    session_id: str               # Backend-generated UUID for this session
    preferences: dict             # Merged User A + User B preference profiles
    query: str                    # Positive-only RAG search query from preferences
    candidates: list[dict]        # Retrieved + filtered movie candidates
    current_index: int            # Pagination cursor for recommendation batches
    seen_movie_ids: set[str]      # Per-session deduplication set
    watchlist: list[dict]         # Session-scoped liked movies
    fallback_triggered: bool      # Whether deterministic fallback was used
```

| Field | Type | Purpose |
|---|---|---|
| `session_id` | `str` | Unique identifier — ties all requests in a session together |
| `preferences` | `dict` | Both users' vibe, brainpower, reality, action, dealbreaker answers |
| `query` | `str` | Natural language query fed to ChromaDB vector search |
| `candidates` | `list` | Films that passed vector retrieval and all four filters |
| `current_index` | `int` | Tracks which candidates have already been shown (pagination) |
| `seen_movie_ids` | `set` | Prevents the same film appearing twice in a session |
| `watchlist` | `list` | Accumulates films the users swiped right on |
| `fallback_triggered` | `bool` | Logged for evaluation — indicates AI degraded to deterministic scoring |

---

## Pipeline Steps

```
┌─────────────────────────────────────────────────────────┐
│  Step 1 — Preference Ingestion                          │
│  Collect User A and User B answers (5 questions each)   │
│  Build a unified preference dict                        │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Step 2 — Query Construction                            │
│  Convert preferences to a positive-only search query    │
│  (omit dealbreakers — ChromaDB finds by similarity,     │
│   not exclusion)                                        │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Step 3 — RAG Retrieval                                 │
│  Query ChromaDB with sentence-transformers embeddings   │
│  Retrieve top-50 candidate films by vector similarity   │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Step 4 — Four Filters (deterministic)                  │
│  1. Genre filter — exclude dealbreaker genres           │
│  2. Runtime filter — enforce runtime preference         │
│  3. Seen filter — remove already-shown movies           │
│  4. Diversity filter — avoid genre clustering           │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Step 5 — AI Scoring (Gemini Flash)                     │
│  For each candidate, generate:                          │
│  - score_a: how well it matches User A (0–100)         │
│  - score_b: how well it matches User B (0–100)         │
│  - fairness_score: balance between the two             │
│  - match_reason: 1–2 sentence plain-English explanation │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Step 5b — Fallback (if AI fails or times out)          │
│  Deterministic scoring: (score_a + score_b) / 2        │
│  No explanation generated                               │
│  fallback_triggered = True logged to episode log        │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Step 6 — Ranking & Batch Return                        │
│  Sort by fairness_score descending                      │
│  Return batch of 10 films as swipeable cards            │
│  Update current_index for pagination                    │
└─────────────────────────────────────────────────────────┘
```

---

## Tools Available to the Agent

| Tool | Type | Description |
|---|---|---|
| `rag_service.retrieve()` | Retrieval | ChromaDB vector similarity search over 200+ films |
| `ai_service.score_movies()` | LLM call | Gemini Flash scores and explains each candidate |
| `recommendation_service.apply_filters()` | Deterministic | Four-filter pipeline (genre, runtime, seen, diversity) |
| `episode_logger.log()` | Side-effect | Writes per-request telemetry to `logs/episode_logs.jsonl` |
| `cost_calculator.calculate_cost()` | Utility | Computes USD cost from token counts |

---

## LLM Resilience

The `llm_resilience.py` utility wraps every AI call with:

- **Timeout:** request cancelled after a fixed deadline
- **Retry:** up to 2 retries with exponential backoff
- **Fallback:** if all retries fail, switches to deterministic scoring silently
- **Logging:** every call outcome written to episode log regardless of result

This ensures the app never returns a 500 error to the user. The worst case is recommendations without AI explanations.

---

## Irreversible Action Map

| Action | Reversible? | Risk | Protection |
|---|---|---|---|
| Generate recommendations | Yes — no DB write | Low | No state mutation |
| Add to watchlist | Yes — can remove | Low | Session-scoped |
| Remove from watchlist | Partially — no undo in UI | Medium | Requires session_id + movie_id |
| Register user account | No | Low | Passwords bcrypt-hashed |
| Reset recommendation session | No | Medium | Should prompt confirmation (future) |
| Delete user data | No | High | Not yet implemented — planned |

---

## Evaluation

The golden set (`eval/run_golden_set.py`) validates the agent across 10 scenarios covering:
- Preference conflicts between users
- Hard dealbreaker exclusions (no horror, no gore)
- Runtime constraints (< 100 minutes)
- Genre diversity requirements

**Result: 10/10 cases passed (100%)** — see `eval/results/` for full timestamped output.

---

## Episode Log Schema

Every AI call writes one line to `logs/episode_logs.jsonl`:

```json
{
  "timestamp": "2026-05-13T19:42:23Z",
  "session_id": "[redacted]",
  "endpoint": "/recommend/session",
  "user_query_or_preferences_summary": "Romantic date night; excludes horror.",
  "model": "gemini-3-flash-preview",
  "prompt_tokens": 366,
  "completion_tokens": 47,
  "total_tokens": 413,
  "latency_ms": 1160,
  "fallback_triggered": false,
  "status": "success",
  "error_type": ""
}
```

Logs are used for cost tracking, latency monitoring, and evaluating fallback rate over time.

---

## Why This Pattern?

| Alternative | Why not used |
|---|---|
| Fully autonomous agent (ReAct loop) | Unpredictable latency; hard to evaluate; overkill for a bounded recommendation task |
| Pure deterministic system | No explanation generation; worse cold-start handling |
| Fine-tuned model | No training data; too expensive for a course project |
| **Orchestrated RAG agent** ✅ | Predictable, fast, explainable, safe, easy to evaluate |

The orchestrated approach also makes the fairness guarantee explicit: the scoring step always receives both user profiles and must produce a `fairness_score`, so the guarantee is in the prompt contract, not emergent from model behaviour.

---

© 2026 Turing Titans · Film Adviser. All rights reserved.
