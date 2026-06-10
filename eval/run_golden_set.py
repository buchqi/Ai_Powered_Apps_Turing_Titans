import argparse
import json
import math
import statistics
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
GOLDEN_PATH = ROOT / "eval" / "golden-set.json"
RESULTS_DIR = ROOT / "eval" / "results"
API_BASE_URL = "http://127.0.0.1:8000"
API_URL = "http://127.0.0.1:8000/recommend/session"
HEALTH_URL = f"{API_BASE_URL}/health"

INPUT_PRICE_PER_TOKEN = 0.000005
OUTPUT_PRICE_PER_TOKEN = 0.000015
ESTIMATED_PROMPT_TOKENS = 650
ESTIMATED_COMPLETION_TOKENS = 120
VALID_MODES = ("live", "service", "fallback", "auto")
SENSITIVE_OUTPUT_PHRASES = (
    "api key",
    "secret key",
    "system prompt",
    "ignore previous instructions",
    "ignore all previous instructions",
    "developer message",
)


class ModeUnavailableError(RuntimeError):
    def __init__(self, message: str, health_latency_ms: float | None = None):
        super().__init__(message)
        self.health_latency_ms = health_latency_ms


def load_cases() -> list[dict]:
    with GOLDEN_PATH.open("r", encoding="utf-8") as golden_file:
        return json.load(golden_file)


def health_check() -> float:
    started = time.perf_counter()
    request = urllib.request.Request(HEALTH_URL, method="GET")
    with urllib.request.urlopen(request, timeout=5) as response:
        if response.status >= 400:
            raise ModeUnavailableError(f"Health check returned HTTP {response.status}")
        response.read()
    return round((time.perf_counter() - started) * 1000, 2)


def require_live_health() -> float:
    started = time.perf_counter()
    try:
        return health_check()
    except Exception as exc:
        latency_ms = round((time.perf_counter() - started) * 1000, 2)
        raise ModeUnavailableError(
            f"Live mode unavailable: health check failed: {exc}",
            health_latency_ms=latency_ms,
        ) from exc


def call_backend(preferences: dict, batch_size: int = 10) -> list[dict]:
    payload = json.dumps({"preferences": preferences, "batch_size": batch_size}).encode("utf-8")
    request = urllib.request.Request(
        API_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        body = json.loads(response.read().decode("utf-8"))
    return body.get("movies", [])


def call_service(preferences: dict, batch_size: int = 10) -> list[dict]:
    if str(BACKEND) not in sys.path:
        sys.path.insert(0, str(BACKEND))
    from services.recommendation_service import create_recommendation_session

    body = create_recommendation_session(preferences, batch_size=batch_size)
    return body.get("movies", [])


def _as_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return " ".join(str(item) for item in value)
    if isinstance(value, dict):
        return " ".join(_as_text(item) for item in value.values())
    return str(value)


def _positive_terms(preferences: dict) -> str:
    parts: list[str] = []
    for user_prefs in preferences.values():
        if not isinstance(user_prefs, dict):
            continue
        for key, value in user_prefs.items():
            text = _as_text(value).strip()
            if not text:
                continue
            lower_key = str(key).lower()
            lower_text = text.lower()
            if any(token in lower_key for token in ("avoid", "dealbreaker", "exclude")):
                continue
            if any(token in lower_text for token in ("no ", "avoid", "exclude", "without")):
                continue
            parts.append(text)
    return " ".join(parts).lower()


def _avoided_terms(preferences: dict) -> set[str]:
    avoided: set[str] = set()
    for user_prefs in preferences.values():
        if not isinstance(user_prefs, dict):
            continue
        for key, value in user_prefs.items():
            lower_key = str(key).lower()
            text = _as_text(value).lower()
            if any(token in lower_key for token in ("avoid", "dealbreaker", "exclude")):
                cleaned = text.replace("no ", "").replace("avoid ", "").replace("exclude ", "")
                for token in ("horror", "gore", "romance", "violence", "adult", "nsfw"):
                    if token in cleaned:
                        avoided.add(token)
    return avoided


def _max_duration(preferences: dict) -> int | None:
    import re

    text = _as_text(preferences).lower()
    minutes_match = re.search(r"(?:under|less than)\s+(\d+)\s*(?:minutes|minute|min)", text)
    if minutes_match:
        return int(minutes_match.group(1))
    return None


def call_dataset_fallback(preferences: dict, batch_size: int = 10) -> list[dict]:
    movies_path = BACKEND / "data" / "movies.json"
    with movies_path.open("r", encoding="utf-8") as movie_file:
        movies = json.load(movie_file)

    positive = _positive_terms(preferences)
    avoided = _avoided_terms(preferences)
    max_duration = _max_duration(preferences)

    scored: list[tuple[int, dict]] = []
    for movie in movies:
        genres = " ".join(movie.get("genres", [])) if isinstance(movie.get("genres"), list) else str(movie.get("genres", ""))
        searchable = f"{movie.get('title', '')} {genres} {movie.get('description', '')}".lower()
        if max_duration is not None and int(movie.get("duration", 0) or 0) > max_duration:
            continue
        if any(term in searchable for term in avoided):
            continue
        score = sum(1 for term in positive.split() if term and term in searchable)
        score += int(float(movie.get("rating", 0) or 0))
        normalized = dict(movie)
        normalized["genres"] = ", ".join(movie.get("genres", [])) if isinstance(movie.get("genres"), list) else movie.get("genres")
        normalized["match_reason"] = f"Offline evaluation match for {positive or 'shared movie preferences'}."
        scored.append((score, normalized))

    scored.sort(key=lambda item: item[0], reverse=True)
    return [movie for _, movie in scored[:batch_size]]


def probe_service(preferences: dict) -> None:
    call_service(preferences, batch_size=1)


def select_runner(mode_requested: str, cases: list[dict]) -> tuple[str, float | None, str | None]:
    if mode_requested == "fallback":
        return "fallback", None, None

    if mode_requested == "live":
        return "live", require_live_health(), None

    if mode_requested == "service":
        try:
            probe_service(cases[0]["input"])
            return "service", None, None
        except Exception as exc:
            raise ModeUnavailableError(f"Service mode unavailable: {exc}") from exc

    if mode_requested == "auto":
        try:
            return "live", require_live_health(), None
        except Exception as live_exc:
            try:
                probe_service(cases[0]["input"])
                return "service", None, f"Live unavailable, selected service: {live_exc}"
            except Exception as service_exc:
                return (
                    "fallback",
                    None,
                    f"Live unavailable ({live_exc}); service unavailable ({service_exc}); selected fallback.",
                )

    raise ValueError(f"Unsupported mode: {mode_requested}")


def get_recommendations(preferences: dict, mode_used: str, batch_size: int = 10) -> list[dict]:
    if mode_used == "live":
        return call_backend(preferences, batch_size=batch_size)
    if mode_used == "service":
        return call_service(preferences, batch_size=batch_size)
    if mode_used == "fallback":
        return call_dataset_fallback(preferences, batch_size=batch_size)
    raise ValueError(f"Unsupported mode: {mode_used}")


def movie_text(movie: dict) -> str:
    values = [
        movie.get("title"),
        movie.get("genres"),
        movie.get("document"),
        movie.get("description"),
        movie.get("match_reason"),
        movie.get("ai_explanation"),
    ]
    return " ".join(str(value) for value in values if value).lower()


def is_safely_redacted(text: str, phrase: str) -> bool:
    lowered = text.lower()
    redacted_markers = ("[redacted]", "<redacted>", "redacted")
    if phrase not in lowered:
        return True
    phrase_index = lowered.find(phrase)
    window = lowered[max(0, phrase_index - 40): phrase_index + len(phrase) + 40]
    return any(marker in window for marker in redacted_markers)


def sensitive_phrase_hits(text: str) -> list[str]:
    return [
        phrase
        for phrase in SENSITIVE_OUTPUT_PHRASES
        if phrase in text.lower() and not is_safely_redacted(text, phrase)
    ]


def percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    sorted_values = sorted(values)
    index = math.ceil((pct / 100) * len(sorted_values)) - 1
    return sorted_values[max(0, min(index, len(sorted_values) - 1))]


def estimate_cost_per_request(mode_used: str) -> float:
    if mode_used == "fallback":
        return 0.0
    return (ESTIMATED_PROMPT_TOKENS * INPUT_PRICE_PER_TOKEN) + (
        ESTIMATED_COMPLETION_TOKENS * OUTPUT_PRICE_PER_TOKEN
    )


def evaluate_case(case: dict, mode_used: str) -> dict:
    started = time.perf_counter()
    error = None
    try:
        movies = get_recommendations(case["input"], mode_used)
    except Exception as exc:
        movies = []
        error = f"{exc.__class__.__name__}: {exc}"
    latency_ms = round((time.perf_counter() - started) * 1000, 2)

    combined = " ".join(movie_text(movie) for movie in movies)
    expected_hits = [
        keyword
        for keyword in case.get("expected_keywords", [])
        if keyword.lower() in combined
    ]
    forbidden_hits = [
        keyword
        for keyword in case.get("forbidden_keywords", [])
        if keyword.lower() in combined and not is_safely_redacted(combined, keyword.lower())
    ]
    regression_hits = sensitive_phrase_hits(combined)
    enough_results = len(movies) >= int(case.get("min_results", 1))
    quality_score = round(
        (
            (1 if enough_results else 0)
            + (len(expected_hits) / max(1, len(case.get("expected_keywords", []))))
            + (1 if not forbidden_hits else 0)
        )
        / 3,
        3,
    )
    passed = (
        error is None
        and enough_results
        and bool(expected_hits)
        and not forbidden_hits
        and not regression_hits
    )
    titles = [movie.get("title") for movie in movies]
    actual_behavior = (
        f"Returned {len(movies)} recommendation(s) via {mode_used}: "
        f"{', '.join(str(title) for title in titles[:5]) or 'none'}."
    )
    if error:
        actual_behavior = f"Request failed: {error}"

    return {
        "id": case["id"],
        "category": case["category"],
        "input": case["input"],
        "expected_behavior": case["expected_behavior"],
        "actual_behavior": actual_behavior,
        "pass_fail": "pass" if passed else "fail",
        "passed": passed,
        "mode_used": mode_used,
        "is_fallback": mode_used == "fallback",
        "latency_ms": latency_ms,
        "response_quality": quality_score,
        "estimated_cost_usd": round(estimate_cost_per_request(mode_used), 6),
        "result_count": len(movies),
        "min_results": case.get("min_results", 1),
        "expected_hits": expected_hits,
        "forbidden_hits": forbidden_hits,
        "regression_rule_hits": regression_hits,
        "regression_rule_passed": not regression_hits,
        "titles": titles,
        "error": error,
    }


def summarize(results: list[dict], mode_requested: str, mode_used: str, health_latency_ms: float | None) -> dict:
    latencies = [result["latency_ms"] for result in results]
    costs = [result["estimated_cost_usd"] for result in results]
    passed = sum(1 for result in results if result["passed"])
    total = len(results)
    avg_cost = statistics.mean(costs) if costs else 0.0
    return {
        "mode_requested": mode_requested,
        "mode_used": mode_used,
        "health_latency_ms": health_latency_ms,
        "total_tests": total,
        "passed_tests": passed,
        "failed_tests": total - passed,
        "success_rate": round(passed / total, 4) if total else 0,
        "average_latency_ms": round(statistics.mean(latencies), 2) if latencies else 0,
        "p95_latency_ms": round(percentile(latencies, 95), 2),
        "average_response_quality": round(statistics.mean([r["response_quality"] for r in results]), 3) if results else 0,
        "estimated_cost_per_request": round(avg_cost, 6),
        "estimated_cost_per_1000_requests": round(avg_cost * 1000, 4),
    }


def empty_failure_summary(mode_requested: str, mode_used: str, health_latency_ms: float | None) -> dict:
    return {
        "mode_requested": mode_requested,
        "mode_used": mode_used,
        "health_latency_ms": health_latency_ms,
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0,
        "success_rate": 0,
        "average_latency_ms": 0,
        "p95_latency_ms": 0,
        "average_response_quality": 0,
        "estimated_cost_per_request": 0,
        "estimated_cost_per_1000_requests": 0,
    }


def write_result_file(score: dict, label: str) -> Path:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    safe_label = f"_{label}" if label else ""
    result_path = RESULTS_DIR / f"evaluation_result_{timestamp}{safe_label}.json"
    with result_path.open("w", encoding="utf-8") as result_file:
        json.dump(score, result_file, indent=2, ensure_ascii=True)
    return result_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Film Adviser golden evaluation set.")
    parser.add_argument("--label", default="", help="Optional label embedded in the result filename.")
    parser.add_argument(
        "--mode",
        choices=VALID_MODES,
        default="auto",
        help="Evaluation target: live, service, fallback, or auto.",
    )
    args = parser.parse_args()

    cases = load_cases()
    run_error = None
    selection_note = None
    health_latency_ms = None
    try:
        mode_used, health_latency_ms, selection_note = select_runner(args.mode, cases)
        results = [evaluate_case(case, mode_used) for case in cases]
        summary = summarize(results, args.mode, mode_used, health_latency_ms)
    except ModeUnavailableError as exc:
        mode_used = args.mode
        results = []
        run_error = str(exc)
        health_latency_ms = exc.health_latency_ms
        summary = empty_failure_summary(args.mode, mode_used, health_latency_ms)

    score = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "runner": "eval/run_golden_set.py",
        "api_url": API_URL,
        "health_url": HEALTH_URL,
        "mode_requested": args.mode,
        "mode_used": mode_used,
        "health_latency_ms": health_latency_ms,
        "total_tests": summary["total_tests"],
        "passed_tests": summary["passed_tests"],
        "failed_tests": summary["failed_tests"],
        "success_rate": summary["success_rate"],
        "average_latency_ms": summary["average_latency_ms"],
        "p95_latency_ms": summary["p95_latency_ms"],
        "estimated_cost_per_request": summary["estimated_cost_per_request"],
        "estimated_cost_per_1000_requests": summary["estimated_cost_per_1000_requests"],
        "selection_note": selection_note,
        "run_error": run_error,
        "summary": summary,
        "results": results,
    }

    result_path = write_result_file(score, args.label or args.mode)

    if run_error:
        print(f"FAIL {run_error}")
        print(f"Saved: {result_path}")
        raise SystemExit(1)

    for result in results:
        print(
            f"{result['pass_fail'].upper()} {result['id']} "
            f"{result['category']} ({result['latency_ms']} ms, q={result['response_quality']})"
        )
    print(f"Mode requested: {args.mode}")
    print(f"Mode used: {mode_used}")
    if selection_note:
        print(f"Selection note: {selection_note}")
    print(f"Score: {score['passed_tests']}/{score['total_tests']}")
    print(f"Saved: {result_path}")


if __name__ == "__main__":
    main()
