# Film Adviser Data Map

| Data item | Source | Purpose | Storage location | Retention | PII risk | Protection |
|-----------|--------|---------|------------------|-----------|----------|------------|
| Session ID | Backend UUID generation | Connect recommendations, pagination, and watchlist actions | In-memory `sessions` dict; episode logs | Session memory until backend restart; logs retained until manually deleted | Low | Random UUID; no account identity |
| User A preferences | Frontend quiz | Build recommendation query and explanation context | In-memory session state; summarized in episode logs | Session memory until backend restart | Medium if user types private data | Logs use summaries and PII redaction |
| User B preferences | Frontend quiz | Balance recommendations for both users | In-memory session state; summarized in episode logs | Session memory until backend restart | Medium if user types private data | Logs use summaries and PII redaction |
| Combined recommendation query | Backend recommendation service | Retrieve movie candidates from ChromaDB | In-memory session state | Session memory until backend restart | Low | Negative preferences excluded from RAG query where possible |
| Movie metadata | `backend/data/movies.json` and ChromaDB | Display recommendations and filter candidates | `backend/data/movies.json`, `backend/vector_db/chroma` | Project dataset retention | Low | Public movie information only |
| Watchlist | User swipe actions | Save liked movies for the current session | In-memory session state | Session memory until backend restart | Low | Session-scoped isolation by `session_id` |
| Episode logs | LLM recommendation explanation calls | Audit latency, token usage, fallback behavior, and errors | `logs/episode_logs.jsonl` | Retained until manually deleted | Medium if raw prompts are logged | Sanitized preference summaries; email, phone, and key redaction |
| API keys | Developer environment variables | Access Gemini and TMDB APIs | Local environment or untracked `.env` | Developer managed | High | `.env` must remain untracked; logs redact key-like patterns |
| Vector embeddings | ChromaDB ingestion | Semantic movie search | `backend/vector_db/chroma` | Until rebuilt or deleted | Low | Built from public movie data, not user data |
| Evaluation results | `eval/evaluate.py` | Capstone quality evidence for golden test set | `eval/results/evaluation_result_<timestamp>.json` | Retained until manually deleted | Low | Uses synthetic non-PII test preferences |
