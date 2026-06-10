#!/usr/bin/env bash
# setup.sh — one-command local setup for Film Adviser
# Usage: ./setup.sh
set -e

echo "🎬 Film Adviser — setup"
echo "========================"

# 1. Check dependencies
command -v docker  >/dev/null 2>&1 || { echo "❌ Docker not found. Install from https://docs.docker.com/get-docker/"; exit 1; }
command -v docker compose version >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose not found."; exit 1; }

# 2. Create .env if missing
if [ ! -f .env ]; then
  echo "📋 Creating .env from .env.example …"
  cp .env.example .env
  echo "⚠️  Open .env and fill in GEMINI_API_KEY and TMDB_API_KEY before proceeding."
  echo "   The app will run without them but AI recommendations will fall back to"
  echo "   deterministic scoring."
fi

# 3. Build and start
echo ""
echo "🐳 Building containers (first run takes ~3 min) …"
docker compose up --build -d

# 4. Wait for health check
echo ""
echo "⏳ Waiting for backend …"
for i in $(seq 1 20); do
  if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ Backend healthy"
    break
  fi
  sleep 3
  if [ "$i" -eq 20 ]; then
    echo "❌ Backend did not become healthy. Check logs: docker compose logs backend"
    exit 1
  fi
done

echo ""
echo "🎉 Film Adviser is running!"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:8000"
echo "   API docs → http://localhost:8000/docs"
echo ""
echo "To stop:  docker compose down"
echo "To reset: docker compose down -v"
