import logging
import os
from typing import Optional

try:
    import google.genai as genai
except ImportError:
    print("ERROR: google-genai package not installed.")
    print("Run: pip install google-genai")
    exit(1)


LOGGER = logging.getLogger(__name__)
MODEL_NAME = "gemini-3-flash-preview"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


def _format_preferences(preferences: dict) -> str:
    if not preferences:
        return "No explicit preferences provided."

    parts = []
    for key, value in preferences.items():
        if value is None:
            continue
        if isinstance(value, str):
            text = value.strip()
            if text:
                parts.append(f"{key}: {text}")
            continue
        if isinstance(value, list):
            values = [str(item).strip() for item in value if str(item).strip()]
            if values:
                parts.append(f"{key}: {', '.join(values)}")
            continue
        parts.append(f"{key}: {value}")

    return "; ".join(parts) if parts else "No explicit preferences provided."


def _as_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return ", ".join(str(v).strip() for v in value if str(v).strip())
    return str(value).strip()


def _extract_genres(movie: dict) -> str:
    for key in ("genres", "genre", "genre_names"):
        text = _as_text(movie.get(key))
        if text:
            return text
    return "unknown genres"


def _extract_duration(movie: dict) -> str:
    for key in ("duration", "runtime", "length", "minutes"):
        text = _as_text(movie.get(key))
        if text:
            return text
    return "unknown runtime"


def _extract_rating(movie: dict) -> str:
    for key in ("rating", "vote_average", "imdb_rating", "score"):
        text = _as_text(movie.get(key))
        if text:
            return text
    return "unknown rating"


def _extract_document(movie: dict) -> str:
    for key in ("document", "description", "overview", "summary", "plot"):
        text = _as_text(movie.get(key))
        if text:
            return text
    return "No description provided."


def _extract_avoided_genres(preferences: dict) -> list[str]:
    avoided: list[str] = []

    def _collect(value) -> None:
        if value is None:
            return
        if isinstance(value, list):
            for item in value:
                cleaned = str(item).strip().lower()
                if cleaned:
                    avoided.append(cleaned)
            return
        cleaned = str(value).strip().lower()
        if cleaned:
            avoided.append(cleaned)

    for key, value in preferences.items():
        if isinstance(value, dict):
            for nested_key, nested_value in value.items():
                if "avoid" in nested_key.lower():
                    _collect(nested_value)
        elif "avoid" in str(key).lower():
            _collect(value)

    unique: list[str] = []
    seen = set()
    for genre in avoided:
        if genre in seen:
            continue
        seen.add(genre)
        unique.append(genre)
    return unique


def _safe_call_llm(preferences: dict, movie: dict) -> Optional[str]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        LOGGER.warning("GEMINI_API_KEY is not set; using fallback match_reason.")
        return None

    title = _as_text(movie.get("title")) or "This movie"
    genres = _extract_genres(movie)
    duration = _extract_duration(movie)
    rating = _extract_rating(movie)
    document = _extract_document(movie)

    prompt = (
        "Write exactly one short user-facing movie-match explanation (1-2 sentences).\n"
        "Output plain text only. No markdown. No JSON.\n"
        "Mention the movie title exactly once.\n"
        "Do not include raw field labels like Title, Genres, Description, Duration, or Rating.\n"
        "Do not use phrases like 'looks like a reasonable fit based on'.\n"
        "Make it specific to this movie, natural, and not generic.\n"
        "If the movie conflicts with constraints (especially avoided genres), say so honestly.\n\n"
        f"User preferences: {_format_preferences(preferences)}\n"
        f"Title: {title}\n"
        f"Genres: {genres}\n"
        f"Duration: {duration}\n"
        f"Rating: {rating}\n"
        f"Description: {document}"
    )

    client = genai.Client(api_key=api_key)


    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            temperature=0.7,
            max_tokens=120,
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise movie recommendation assistant.",
                },
                {"role": "user", "content": prompt},
            ],
        )
    except Exception as exc:
        LOGGER.warning("LLM call failed for movie '%s': %s", movie.get("title"), exc)
        return None

    if not response.choices:
        return None

    answer = (response.choices[0].message.content or "").strip()
    answer = " ".join(answer.split())
    return answer or None


def _movie_specific_fallback_reason(preferences: dict, movie: dict) -> str:
    title = _as_text(movie.get("title")) or "This movie"
    genres = _extract_genres(movie)
    duration = _extract_duration(movie)
    rating = _extract_rating(movie)
    avoided = _extract_avoided_genres(preferences)
    lower_genres = genres.lower()

    conflicting = [genre for genre in avoided if genre in lower_genres]
    if conflicting:
        return (
            f"{title} may be a weaker match because it includes {', '.join(conflicting)}, "
            f"which appears in your avoided genres. Its {duration} runtime may also affect compatibility."
        )

    return (
        f"{title} is a stronger match for your preferences because its {genres} tone and pacing align well overall. "
        f"The {duration} runtime and {rating} rating make it a practical option for both users."
    )


def add_ai_explanations(preferences: dict, movies: list[dict]) -> list[dict]:
    updated_movies = []
    for movie in movies:
        movie_with_reason = dict(movie)
        reason = _safe_call_llm(preferences, movie)
        movie_with_reason["match_reason"] = reason or _movie_specific_fallback_reason(
            preferences, movie
        )
        updated_movies.append(movie_with_reason)

    return updated_movies
