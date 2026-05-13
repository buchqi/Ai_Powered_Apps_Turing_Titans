# Safety and Evaluation Audit

## Project Information

| Field | Value |
|-------|-------|
| Project Name | Film Adviser |
| Team Name | Turing Titans |
| Repository | `https://github.com/buchqi/Ai_Powered_Apps_Turing_Titans.git` |
| Audit Date | 2026-05-13 |
| Commit SHA | `32634fcded33ab1542c71938783cf2a157c98c71` |

---

## Area 1: Episode Log Quality

**Status:** Complete.

Film Adviser has a structured JSONL episode log for LLM recommendation explanation calls. The reusable logger writes to [logs/episode_logs.jsonl](../logs/episode_logs.jsonl), and sample generation is provided by [scripts/generate_episode_log_sample.py](../scripts/generate_episode_log_sample.py). The current log file contains **120 entries**.

### Required Fields Coverage

The current `logs/episode_logs.jsonl` file was inspected and each required field is present in all 120 entries.

| Required field | Coverage |
|----------------|----------|
| `timestamp` | 120 / 120 |
| `session_id` | 120 / 120 |
| `endpoint` | 120 / 120 |
| `user_query_or_preferences_summary` | 120 / 120 |
| `model` | 120 / 120 |
| `prompt_tokens` | 120 / 120 |
| `completion_tokens` | 120 / 120 |
| `total_tokens` | 120 / 120 |
| `cache_read_tokens` | 120 / 120 |
| `latency_ms` | 120 / 120 |
| `fallback_triggered` | 120 / 120 |
| `status` | 120 / 120 |
| `error_type` | 120 / 120 |

### Logging Architecture Summary

Episode logging is centralized in [backend/utils/episode_logger.py](../backend/utils/episode_logger.py). The logger:

- Writes one JSON object per line to `logs/episode_logs.jsonl`.
- Sanitizes obvious email addresses, phone numbers, and key-like secrets before writing text fields.
- Stores summarized preference text instead of raw user profiles.
- Defaults unavailable token fields to `0`, including `cache_read_tokens`.
- Requires `fallback_triggered` as a boolean.
- Records `latency_ms` for the handled LLM path.

The active recommendation explanation flow in [backend/services/ai_service.py](../backend/services/ai_service.py) writes episode logs for successful LLM calls and fallback paths such as missing SDK, missing API key, empty response, timeout, or other handled LLM errors. The older compatibility service [backend/services/aiService.py](../backend/services/aiService.py) also writes an episode log entry when used.

### Five Consecutive Sample Entries

The following are the first five consecutive entries currently present in `logs/episode_logs.jsonl`:

```json
{"timestamp": "2026-05-13T19:16:52.275531+00:00", "session_id": "[redacted-secret]", "endpoint": "/recommend/session", "user_query_or_preferences_summary": "Tense thriller request; excludes gore and explicit horror.", "model": "gemini-3-flash-preview", "prompt_tokens": 366, "completion_tokens": 0, "total_tokens": 366, "cache_read_tokens": 0, "latency_ms": 824, "fallback_triggered": true, "status": "fallback", "error_type": "timeout"}
{"timestamp": "2026-05-13T19:16:52.275997+00:00", "session_id": "[redacted-secret]", "endpoint": "/recommend/session", "user_query_or_preferences_summary": "Family-friendly animated adventure with no intense violence.", "model": "gemini-3-flash-preview", "prompt_tokens": 334, "completion_tokens": 47, "total_tokens": 381, "cache_read_tokens": 0, "latency_ms": 925, "fallback_triggered": false, "status": "success", "error_type": ""}
{"timestamp": "2026-05-13T19:16:52.276358+00:00", "session_id": "[redacted-secret]", "endpoint": "/recommend/session", "user_query_or_preferences_summary": "Both users want thoughtful sci-fi with emotional drama.", "model": "gemini-3-flash-preview", "prompt_tokens": 251, "completion_tokens": 64, "total_tokens": 315, "cache_read_tokens": 0, "latency_ms": 1160, "fallback_triggered": false, "status": "success", "error_type": ""}
{"timestamp": "2026-05-13T19:16:52.276575+00:00", "session_id": "[redacted-secret]", "endpoint": "/recommend/session", "user_query_or_preferences_summary": "Emotional drama requested, but not bleak or too dark.", "model": "gemini-3-flash-preview", "prompt_tokens": 213, "completion_tokens": 33, "total_tokens": 246, "cache_read_tokens": 0, "latency_ms": 2050, "fallback_triggered": false, "status": "success", "error_type": ""}
{"timestamp": "2026-05-13T19:16:52.276774+00:00", "session_id": "751eb844-7fc[redacted-phone]eb-aa2ea1f015fd", "endpoint": "/recommend/session", "user_query_or_preferences_summary": "Recent action or adventure with clean pacing.", "model": "gemini-3-flash-preview", "prompt_tokens": 419, "completion_tokens": 95, "total_tokens": 514, "cache_read_tokens": 0, "latency_ms": 1294, "fallback_triggered": false, "status": "success", "error_type": ""}
```

### Verification Commands

```bash
python scripts/generate_episode_log_sample.py
```

Optional field coverage check:

```powershell
$entries = Get-Content logs\episode_logs.jsonl | ForEach-Object { $_ | ConvertFrom-Json }
```

### Remaining Limitations

- Logs are stored locally in JSONL format and retention is manual.
- Sample logs are synthetic evidence when real usage does not yet produce 100+ records.
- `cache_read_tokens` is recorded as `0` when Gemini metadata does not provide cache-read token counts.
- Some sample `session_id` values are redacted by the same sanitizer used for logs, which is privacy-preserving but can reduce readability of synthetic UUIDs.

---

## Area 2: Agent Architecture Documentation

**Status:** Complete, with one documentation limitation noted below.

### README Evidence Links

- [README.md: Agent Architecture](../README.md#agent-architecture)
- [backend/services/recommendation_service.py](../backend/services/recommendation_service.py)
- [backend/services/rag_service.py](../backend/services/rag_service.py)
- [backend/services/ai_service.py](../backend/services/ai_service.py)

### Agent Pattern Choice

The documented pattern is an **orchestrated RAG recommendation agent**.

### Why This Architecture Was Selected

The architecture is designed for a predictable recommendation workflow:

1. User preference inputs are converted into a positive-only retrieval query.
2. ChromaDB retrieval returns candidate movie records.
3. Deterministic filters apply dealbreakers such as avoided genres and duration limits.
4. The LLM is used for short match explanations rather than uncontrolled decision-making.
5. Session state tracks pagination, seen movies, and watchlist items.

This pattern is appropriate for Film Adviser because it keeps the core recommendation flow inspectable, limits irreversible operations, supports fallback explanations, and allows straightforward evaluation with a golden test set.

### AgentState Dataclass Summary

The README documents this intended state shape:

| Field | Purpose |
|-------|---------|
| `session_id` | Backend-generated identifier for one recommendation session |
| `preferences` | User A and User B preferences |
| `query` | Positive-only RAG query derived from preferences |
| `candidates` | Retrieved and filtered movie candidates |
| `current_index` | Pagination cursor |
| `seen_movie_ids` | Duplicate-prevention set |
| `watchlist` | Session-scoped liked movies |
| `fallback_triggered` | Whether fallback behavior was used |

Runtime state is currently implemented as dictionaries in `recommendation_service.py`, while the README dataclass provides the documented architecture contract.

### Irreversible Action Map

The README includes the following action map:

| Action | Reversible? | Risk | Protection |
|--------|-------------|------|------------|
| Generate recommendations | Yes | Low | No persistent mutation |
| Add to watchlist | Yes | Low | Session-scoped |
| Remove from watchlist | Partially | Medium | Requires `session_id` and `movie_id` |
| Reset session | No | High | Should require confirmation in future |
| Delete stored user data | No | High | Not implemented yet |

### Guard and Checkpoint Summary

Current guardrails visible in code and documentation include:

- Recommendation query construction excludes negative preference fields where possible.
- Filtering removes movies that match hard constraints such as avoided genres.
- Watchlist operations require a `session_id`.
- Duplicate recommendations and watchlist entries are reduced through stable movie keys.
- LLM explanations fall back to deterministic explanations when the API key, SDK, response, timeout, or call result fails.
- API request bodies use Pydantic models in [backend/main.py](../backend/main.py).

### Model Selection Decisions Summary

The repository does not currently contain a dedicated `Model Selection Decisions` section. Existing evidence shows:

- README AI Integration currently lists a primary model and fallback model in the architecture section.
- Active Gemini explanation code uses `gemini-3-flash-preview` in [backend/services/ai_service.py](../backend/services/ai_service.py).
- The legacy AI service also uses `gemini-3-flash-preview` in [backend/services/aiService.py](../backend/services/aiService.py).

### Verification Instructions

Review the documented architecture and implementation files:

```bash
rg -n "Agent Architecture|AgentState|Irreversible action map" README.md
rg -n "sessions|create_recommendation_session|filter_movies|watchlist" backend/services/recommendation_service.py
```

### Remaining Limitations

- Runtime state is implemented with dictionaries rather than a formal `AgentState` dataclass.
- A dedicated `Model Selection Decisions` section is not present; model evidence is distributed across README and service files.
- Session state is in memory and is lost when the backend restarts.

---

## Area 3: Resilience Patterns

**Status:** Complete.

### Timeout Implementation

Timeout handling is implemented in [backend/utils/llm_resilience.py](../backend/utils/llm_resilience.py). The helper runs the LLM call in a `ThreadPoolExecutor` and uses `future.result(timeout=timeout_seconds)` to enforce the configured timeout. The active Gemini service calls the helper with `DEFAULT_TIMEOUT_SECONDS = 12`.

### Exponential Backoff Implementation

The same helper implements exponential backoff using:

```python
time.sleep(initial_backoff_seconds * (2**attempt))
```

The default initial backoff is `0.5` seconds.

### Retry Logic

`call_with_resilience()` accepts `max_retries` and calculates total attempts as `max_retries + 1`. The active recommendation explanation service uses `DEFAULT_MAX_RETRIES = 2`, for up to three total attempts.

### Fallback Behavior

When all attempts fail, the helper returns an `LLMCallResult` with:

- `fallback_triggered=True`
- `status="fallback"`
- sanitized `error_type`
- measured `latency_ms`
- caller-provided fallback value

The active AI service then writes an episode log entry and returns a deterministic movie-specific fallback explanation instead of exposing a stack trace to the API response. Missing `google-genai`, missing `GEMINI_API_KEY`, empty responses, timeouts, and generic exceptions are handled.

### Evidence File Links

- [backend/utils/llm_resilience.py](../backend/utils/llm_resilience.py)
- [backend/services/ai_service.py](../backend/services/ai_service.py)
- [backend/services/aiService.py](../backend/services/aiService.py)
- [backend/utils/episode_logger.py](../backend/utils/episode_logger.py)

### Code References

| Implementation concern | Evidence |
|------------------------|----------|
| Timeout | `future.result(timeout=timeout_seconds)` in `llm_resilience.py` |
| Retry count | `attempts = max(1, int(max_retries) + 1)` in `llm_resilience.py` |
| Exponential backoff | `initial_backoff_seconds * (2**attempt)` in `llm_resilience.py` |
| Active Gemini wrapper | `_safe_call_llm()` in `ai_service.py` |
| Legacy Gemini wrapper | `AiService.get_recommendations()` in `aiService.py` |
| Fallback logging | `write_episode_log(...)` calls in AI service files |

### Verification Instructions

Run the backend without a `GEMINI_API_KEY` and request recommendations. The expected behavior is a valid response with fallback explanations and episode log entries marked with `fallback_triggered=true`.

Static verification:

```bash
rg -n "timeout_seconds|max_retries|initial_backoff_seconds|fallback_triggered|write_episode_log" backend/utils backend/services
```

### Remaining Limitations

- Timeout handling wraps synchronous SDK calls in a worker thread; the underlying SDK operation may continue briefly after the user-facing timeout path returns.
- Retry and timeout settings are constants/defaults in code, not environment-driven configuration.
- Fallback explanations preserve availability but are less personalized than successful LLM explanations.

---

## Area 4: Golden Test Set and Evaluation

**Status:** Complete, with script-name limitation noted below.

### Golden Test Set Location

Golden test cases are stored in [eval/golden_questions.json](../eval/golden_questions.json).

### Evaluation Script Location

The implemented evaluation script is [eval/evaluate.py](../eval/evaluate.py).

The repository currently does **not** contain `eval/run_golden_set.py`.

### Number of Tests

The golden set contains **10 test cases**:

| ID | Test name | Coverage focus |
|----|-----------|----------------|
| G01 | Romantic date night without horror | Romance/date-night request with horror exclusion |
| G02 | Sci-fi for one user and drama for the other | Preference compromise across genres |
| G03 | Short movie under 100 minutes | Runtime constraint |
| G04 | Family-friendly animated movie | Family/animation request |
| G05 | Thriller request excluding gore | Suspense with gore/horror exclusion |
| G06 | Comedy for tired evening | Low-effort comedy |
| G07 | High-rated classic movie | High-rated classic-style recommendation |
| G08 | Recent action movie | Action/adventure request |
| G09 | Emotional drama but not too dark | Emotional tone with darkness constraint |
| G10 | Balanced compromise between different tastes | Multi-user compromise |

### Pass/Fail Summary

Latest inspected evaluation result:

- File: [eval/results/evaluation_result_20260513_191939.json](../eval/results/evaluation_result_20260513_191939.json)
- Timestamp: `2026-05-13T19:19:39.120945+00:00`
- Passed: `10`
- Total: `10`
- Score: `1.0`
- Source: `dataset_fallback` for the recorded run

The result file shows every golden case passed with no forbidden keyword hits.

### Latest Evaluation Results File

[eval/results/evaluation_result_20260513_191939.json](../eval/results/evaluation_result_20260513_191939.json)

### Edge-Case Coverage

The golden set covers:

- Negative constraints such as “No horror,” “No gore,” and “No romance.”
- Runtime filtering with “under 100 minutes.”
- Cross-user taste compromise.
- Family-friendly and animated preferences.
- High-rated/classic recommendations.
- Recent/action-oriented recommendations.
- Emotional tone constraints.

### Verification Command

Current implemented command:

```bash
python eval/evaluate.py
```

Assignment-facing command currently requested by the team, but not present in this repository:

```bash
python eval/run_golden_set.py
```

### Remaining Limitations

- The evaluator uses keyword checks rather than semantic grading.
- The latest recorded run used `dataset_fallback` because the local backend endpoint was not running and direct ChromaDB access was unavailable in the environment at that time.
- `eval/run_golden_set.py` is not present; the existing runnable evaluator is `eval/evaluate.py`.

---

## Area 5: Data Governance Evidence

**Status:** Complete.

### Data Map Link

The data map is documented in [docs/data-map.md](data-map.md). It covers session IDs, User A preferences, User B preferences, combined recommendation query, movie metadata, watchlist, episode logs, API keys, vector embeddings, and evaluation results.

### Session Isolation Testing

Session isolation is tested in [tests/test_data_governance.py](../tests/test_data_governance.py). The test creates two fake sessions, adds a watchlist item to session A, and verifies session B cannot see it.

### PII Prevention in Logs

The governance test checks `logs/episode_logs.jsonl` for obvious:

- Email addresses
- Phone numbers
- Raw Gemini-style or OpenAI-style API keys

PII prevention is also supported by [backend/utils/episode_logger.py](../backend/utils/episode_logger.py), which sanitizes text before writing log entries.

### `.env` History Verification

The verification command:

```bash
git log --all -- .env
```

returned no commit history output during inspection. The test script also checks that `.env` is not tracked using:

```bash
git ls-files .env
```

### Governance Architecture Summary

Current governance controls are intentionally simple and appropriate for the current project state:

- User preferences and watchlists are stored only in in-memory session state.
- Movie metadata and vector embeddings are derived from public movie data.
- Episode logs store preference summaries rather than raw full user submissions.
- Secret-like values are redacted from log text.
- API keys are expected to live in environment variables or untracked local files.
- Evaluation data uses synthetic non-PII test preferences.

### Verification Commands

```bash
python tests/test_data_governance.py
git log --all -- .env
```

### Remaining Limitations

- Session and watchlist data are not persistent and disappear on backend restart.
- Log retention and deletion are manual.
- PII detection uses pattern checks for obvious emails, phone numbers, and key formats; it is not a complete privacy classifier.
- There is no persistent user data deletion workflow because persistent user data is not currently implemented.

---

## Final Audit Checklist

| Area | Status |
|------|--------|
| [x] Episode logs | Complete |
| [x] Agent architecture | Complete |
| [x] Resilience | Complete |
| [x] Golden test set | Complete |
| [x] Data governance | Complete |
