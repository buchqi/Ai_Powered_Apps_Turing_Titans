# Deployment Readiness

Date: 2026-06-10

## Docker Build Status

PASS

- `docker compose up --build -d` completed successfully.
- Backend image built: `ai_powered_apps_turing_titans-backend:latest`
- Frontend image built: `ai_powered_apps_turing_titans-frontend:latest`
- Measured image sizes:
  - Backend: `9.42GB`
  - Frontend: `94.7MB`

## Health Endpoint Status

PASS

Command:

```bash
curl http://localhost:8000/health
```

Result:

```json
{"status":"ok","timestamp":"2026-06-10T16:45:33.602034"}
```

## Recommendation Endpoint Status

PASS

Command:

```bash
curl -X POST http://localhost:8000/recommend/session \
  -H "Content-Type: application/json" \
  -d '{"preferences":{"userA":{"vibe":"warm romantic date night","brainpower":"light","reality":"fictional","action":"low action","dealbreaker":"no horror"},"userB":{"vibe":"funny heartfelt adventure","brainpower":"medium","reality":"fictional","action":"some action","dealbreaker":"no gore"}},"batch_size":2}'
```

Result:

- HTTP status: `200`
- Response included `session_id`.
- Response included `movies` with 2 recommendations.
- Response included `match_reason` for each recommendation.
- Response included `has_more: true`.
- No server errors occurred.

## Docker Configuration Verification

PASS

- `backend/Dockerfile` uses Railway's `PORT` variable: `--port ${PORT:-8000}`.
- Uvicorn binds to `0.0.0.0`.
- The Dockerfile does not hardcode `localhost`.
- `backend/.dockerignore` excludes `.env`, caches, virtualenvs, logs, tests, `.git`, `node_modules`, and compiled Python files.
- `docker-compose.yml` does not mount a volume over `/app`.
- `docker-compose.yml` does not mount an empty volume over `/app/vector_db`.
- The only persistent backend volume is mounted at `/data`.
- Frontend exposes `3000:80`.
- Frontend waits for the backend healthcheck.

## Known Limitations

- Backend image is large (`9.42GB`) because `chromadb` and `sentence-transformers` pull a heavy ML dependency chain. This is acceptable for the current course deployment, but a production optimization pass should reduce image size.
- Existing local Docker volumes created before the migration fix may contain an invalid SQLite database. If local Compose fails with `sqlite3.OperationalError: no such table: users`, remove the old local Compose volume with `docker compose down -v`, then rerun `docker compose up --build`.
- SQLite is suitable for local smoke tests. Railway deployment should use Railway PostgreSQL through `DATABASE_URL`.
- `GEMINI_API_KEY` is optional. If it is absent or the model call fails, recommendations still work with deterministic fallback explanations.

## Exact Railway Deployment Steps

1. Create a new Railway project from the GitHub repository.
2. Create a backend service.
3. Set the backend service root directory to `backend`.
4. Use Dockerfile deployment; Railway should build `backend/Dockerfile`.
5. Add a Railway PostgreSQL database.
6. Set backend environment variables:
   - `DATABASE_URL`: Railway PostgreSQL connection URL.
   - `SECRET_KEY`: long random JWT secret.
   - `GEMINI_API_KEY`: optional, enables AI explanations.
   - `TMDB_API_KEY`: optional, used by poster tooling.
7. Do not set a fixed backend port. Railway provides `PORT`; the Dockerfile uses `${PORT:-8000}`.
8. Set health check path to `/health`.
9. Deploy backend.
10. Verify backend health:

```bash
curl https://<railway-backend-domain>/health
```

11. Verify recommendations:

```bash
curl -X POST https://<railway-backend-domain>/recommend/session \
  -H "Content-Type: application/json" \
  -d '{"preferences":{"userA":{"vibe":"warm romantic date night","brainpower":"light","reality":"fictional","action":"low action","dealbreaker":"no horror"},"userB":{"vibe":"funny heartfelt adventure","brainpower":"medium","reality":"fictional","action":"some action","dealbreaker":"no gore"}},"batch_size":2}'
```

12. Deploy frontend separately.
13. Set frontend `VITE_API_URL` to `https://<railway-backend-domain>`.
14. Rebuild frontend after changing `VITE_API_URL`.

## Verdict

Railway-ready for backend deployment after setting required environment variables and using Railway PostgreSQL.
