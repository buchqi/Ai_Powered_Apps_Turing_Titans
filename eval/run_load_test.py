import argparse
import concurrent.futures
import json
import math
import statistics
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
GOLDEN_PATH = ROOT / "eval" / "golden-set.json"
RESULTS_DIR = ROOT / "eval" / "results"
API_URL = "http://127.0.0.1:8000/recommend/session"


def load_cases() -> list[dict]:
    with GOLDEN_PATH.open("r", encoding="utf-8") as golden_file:
        return json.load(golden_file)


def _as_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return " ".join(_as_text(item) for item in value)
    if isinstance(value, dict):
        return " ".join(_as_text(item) for item in value.values())
    return str(value)


def _positive_terms(preferences: dict) -> str:
    terms: list[str] = []
    for user_prefs in preferences.values():
        if not isinstance(user_prefs, dict):
            continue
        for key, value in user_prefs.items():
            lower_key = str(key).lower()
            text = _as_text(value).strip()
            lower_text = text.lower()
            if not text or any(token in lower_key for token in ("avoid", "dealbreaker", "exclude")):
                continue
            if any(token in lower_text for token in ("no ", "avoid", "exclude", "without")):
                continue
            terms.append(text)
    return " ".join(terms).lower()


def _avoided_terms(preferences: dict) -> set[str]:
    avoided: set[str] = set()
    for user_prefs in preferences.values():
        if not isinstance(user_prefs, dict):
            continue
        for key, value in user_prefs.items():
            if not any(token in str(key).lower() for token in ("avoid", "dealbreaker", "exclude")):
                continue
            text = _as_text(value).lower()
            for token in ("horror", "gore", "romance", "violence", "adult", "nsfw"):
                if token in text:
                    avoided.add(token)
    return avoided


def call_live(preferences: dict, batch_size: int = 5) -> int:
    payload = json.dumps({"preferences": preferences, "batch_size": batch_size}).encode("utf-8")
    request = urllib.request.Request(
        API_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        body = json.loads(response.read().decode("utf-8"))
    return len(body.get("movies", []))


def call_fallback(preferences: dict, batch_size: int = 5) -> int:
    movies_path = BACKEND / "data" / "movies.json"
    with movies_path.open("r", encoding="utf-8") as movie_file:
        movies = json.load(movie_file)

    positive = _positive_terms(preferences)
    avoided = _avoided_terms(preferences)
    scored: list[tuple[int, dict]] = []
    for movie in movies:
        genres = " ".join(movie.get("genres", [])) if isinstance(movie.get("genres"), list) else str(movie.get("genres", ""))
        searchable = f"{movie.get('title', '')} {genres} {movie.get('description', '')}".lower()
        if any(term in searchable for term in avoided):
            continue
        score = sum(1 for term in positive.split() if term in searchable)
        score += int(float(movie.get("rating", 0) or 0))
        scored.append((score, movie))
    scored.sort(key=lambda item: item[0], reverse=True)
    return len(scored[:batch_size])


def run_one(case: dict, mode: str) -> dict:
    started = time.perf_counter()
    error = None
    count = 0
    try:
        if mode == "live":
            count = call_live(case["input"])
        else:
            count = call_fallback(case["input"])
    except Exception as exc:
        error = f"{exc.__class__.__name__}: {exc}"

    return {
        "case_id": case["id"],
        "mode": mode,
        "latency_ms": round((time.perf_counter() - started) * 1000, 2),
        "success": error is None and count > 0,
        "result_count": count,
        "error": error,
    }


def percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    sorted_values = sorted(values)
    index = math.ceil((pct / 100) * len(sorted_values)) - 1
    return sorted_values[max(0, min(index, len(sorted_values) - 1))]


def summarize(results: list[dict], mode: str, users: int, requests: int, elapsed_seconds: float) -> dict:
    latencies = [result["latency_ms"] for result in results]
    successes = sum(1 for result in results if result["success"])
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "mode": mode,
        "target": API_URL if mode == "live" else str(BACKEND / "data" / "movies.json"),
        "concurrent_users": users,
        "total_requests": requests,
        "duration_seconds": round(elapsed_seconds, 3),
        "throughput_rps": round(requests / elapsed_seconds, 2) if elapsed_seconds else 0,
        "average_latency_ms": round(statistics.mean(latencies), 2) if latencies else 0,
        "p50_latency_ms": round(percentile(latencies, 50), 2),
        "p90_latency_ms": round(percentile(latencies, 90), 2),
        "p95_latency_ms": round(percentile(latencies, 95), 2),
        "p99_latency_ms": round(percentile(latencies, 99), 2),
        "peak_latency_ms": round(max(latencies), 2) if latencies else 0,
        "error_rate": round((requests - successes) / requests, 4) if requests else 0,
        "successful_requests": successes,
        "failed_requests": requests - successes,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Film Adviser load tests.")
    parser.add_argument("--mode", choices=("live", "fallback"), required=True)
    parser.add_argument("--users", type=int, default=8)
    parser.add_argument("--requests", type=int, default=48)
    parser.add_argument("--label", default="")
    args = parser.parse_args()

    cases = load_cases()
    request_cases = [cases[index % len(cases)] for index in range(args.requests)]

    started = time.perf_counter()
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.users) as executor:
        results = list(executor.map(lambda case: run_one(case, args.mode), request_cases))
    elapsed_seconds = time.perf_counter() - started

    summary = summarize(results, args.mode, args.users, args.requests, elapsed_seconds)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    label = f"_{args.label}" if args.label else f"_{args.mode}"
    result_path = RESULTS_DIR / f"load_test_result_{timestamp}{label}.json"
    with result_path.open("w", encoding="utf-8") as result_file:
        json.dump({"summary": summary, "results": results}, result_file, indent=2, ensure_ascii=True)

    print(json.dumps(summary, indent=2))
    print(f"Saved: {result_path}")
    if args.mode == "live" and summary["failed_requests"] == args.requests:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
