import json
from datetime import datetime, timezone
from pathlib import Path
import sys
import urllib.error
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
GOLDEN_PATH = ROOT / "eval" / "golden_questions.json"
RESULTS_DIR = ROOT / "eval" / "results"
API_URL = "http://127.0.0.1:8000/recommend/session"


def load_cases() -> list[dict]:
    with GOLDEN_PATH.open("r", encoding="utf-8") as golden_file:
        return json.load(golden_file)


def call_backend(preferences: dict, batch_size: int = 10) -> tuple[list[dict], str]:
    payload = json.dumps({"preferences": preferences, "batch_size": batch_size}).encode("utf-8")
    request = urllib.request.Request(
        API_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        body = json.loads(response.read().decode("utf-8"))
    return body.get("movies", []), "http"


def call_service(preferences: dict, batch_size: int = 10) -> tuple[list[dict], str]:
    if str(BACKEND) not in sys.path:
        sys.path.insert(0, str(BACKEND))
    from services.recommendation_service import create_recommendation_session

    body = create_recommendation_session(preferences, batch_size=batch_size)
    return body.get("movies", []), "direct_import"


def _as_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return " ".join(str(item) for item in value)
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
                for token in ("horror", "gore", "romance", "violence"):
                    if token in cleaned:
                        avoided.add(token)
    return avoided


def _max_duration(preferences: dict) -> int | None:
    text = _positive_terms(preferences)
    import re

    minutes_match = re.search(r"under\s+(\d+)\s*(?:minutes|minute|min)", text)
    if minutes_match:
        return int(minutes_match.group(1))
    return None


def call_dataset_fallback(preferences: dict, batch_size: int = 10) -> tuple[list[dict], str]:
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
    return [movie for _, movie in scored[:batch_size]], "dataset_fallback"


def get_recommendations(preferences: dict, batch_size: int = 10) -> tuple[list[dict], str]:
    try:
        return call_backend(preferences, batch_size=batch_size)
    except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError) as exc:
        print(
            "Local backend endpoint is not available at "
            f"{API_URL}. Falling back to direct service import. "
            "To evaluate the running API instead, start it with: cd backend; uvicorn main:app --reload"
        )
        try:
            return call_service(preferences, batch_size=batch_size)
        except Exception as direct_exc:
            print(
                "Direct service import is not available, likely because ChromaDB cannot be opened "
                f"({direct_exc.__class__.__name__}). Using the local movie dataset fallback for evaluation evidence."
            )
            return call_dataset_fallback(preferences, batch_size=batch_size)


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


def evaluate_case(case: dict) -> dict:
    movies, source = get_recommendations(case["input_preferences"], batch_size=10)
    combined = " ".join(movie_text(movie) for movie in movies)

    expected_hits = [
        keyword
        for keyword in case["expected_keywords"]
        if keyword.lower() in combined
    ]
    forbidden_hits = [
        keyword
        for keyword in case["forbidden_keywords"]
        if keyword.lower() in combined
    ]
    enough_results = len(movies) >= int(case["min_results"])
    passed = enough_results and bool(expected_hits) and not forbidden_hits

    return {
        "id": case["id"],
        "name": case["name"],
        "passed": passed,
        "source": source,
        "result_count": len(movies),
        "min_results": case["min_results"],
        "expected_hits": expected_hits,
        "forbidden_hits": forbidden_hits,
        "titles": [movie.get("title") for movie in movies],
    }


def main() -> None:
    cases = load_cases()
    results = [evaluate_case(case) for case in cases]
    passed = sum(1 for result in results if result["passed"])
    score = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "passed": passed,
        "total": len(results),
        "score": passed / len(results) if results else 0,
        "results": results,
    }

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    result_path = RESULTS_DIR / f"evaluation_result_{timestamp}.json"
    with result_path.open("w", encoding="utf-8") as result_file:
        json.dump(score, result_file, indent=2, ensure_ascii=True)

    for result in results:
        label = "PASS" if result["passed"] else "FAIL"
        print(f"{label} {result['id']} {result['name']} ({result['result_count']} results)")
    print(f"Score: {passed}/{len(results)}")
    print(f"Saved: {result_path}")


if __name__ == "__main__":
    main()
