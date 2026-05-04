import uuid
import re

from services.ai_service import add_ai_explanations
from services.rag_service import search_movies


sessions: dict[str, dict] = {}


def _collect_avoided_genres(preferences: dict) -> set[str]:
    avoided: set[str] = set()

    def _collect(value) -> None:
        if value is None:
            return
        if isinstance(value, list):
            for item in value:
                text = str(item).strip().lower()
                if text:
                    avoided.add(text)
            return
        text = str(value).strip().lower()
        if text:
            avoided.add(text)

    for key, value in preferences.items():
        key_text = str(key).lower()
        if isinstance(value, dict):
            for nested_key, nested_value in value.items():
                if "avoid" in str(nested_key).lower():
                    _collect(nested_value)
        elif "avoid" in key_text:
            _collect(value)

    return avoided


def _get_max_duration(preferences: dict) -> int | None:
    duration_texts: list[str] = []

    def _collect_duration_texts(value) -> None:
        if value is None:
            return
        if isinstance(value, list):
            for item in value:
                text = str(item).strip().lower()
                if text:
                    duration_texts.append(text)
            return
        text = str(value).strip().lower()
        if text:
            duration_texts.append(text)

    for key, value in preferences.items():
        key_text = str(key).lower()
        if isinstance(value, dict):
            for nested_key, nested_value in value.items():
                if any(word in str(nested_key).lower() for word in ("duration", "runtime", "length", "time")):
                    _collect_duration_texts(nested_value)
        elif any(word in key_text for word in ("duration", "runtime", "length", "time")):
            _collect_duration_texts(value)

    for text in duration_texts:
        hours_match = re.search(r"(under|less than)\s*(\d+(?:\.\d+)?)\s*hours?", text)
        if hours_match:
            hours = float(hours_match.group(2))
            return int(hours * 60)

        minutes_match = re.search(r"(under|less than)\s*(\d+)\s*(minutes?|mins?|min)", text)
        if minutes_match:
            return int(minutes_match.group(2))

    return None


def _extract_movie_duration_minutes(movie: dict) -> int | None:
    for key in ("duration", "runtime", "length", "minutes"):
        value = movie.get(key)
        if value is None:
            continue
        if isinstance(value, (int, float)):
            return int(value)

        text = str(value).strip().lower()
        if not text:
            continue

        hours_minutes_match = re.search(r"(\d+)\s*h(?:ours?)?\s*(\d+)?\s*m?", text)
        if hours_minutes_match:
            hours = int(hours_minutes_match.group(1))
            minutes = int(hours_minutes_match.group(2) or 0)
            return hours * 60 + minutes

        hours_match = re.search(r"(\d+(?:\.\d+)?)\s*hours?", text)
        if hours_match:
            return int(float(hours_match.group(1)) * 60)

        minutes_match = re.search(r"(\d+)\s*(minutes?|mins?|min)\b", text)
        if minutes_match:
            return int(minutes_match.group(1))

        number_match = re.search(r"\b(\d{2,3})\b", text)
        if number_match:
            return int(number_match.group(1))

    return None


def _movie_has_avoided_genre(movie: dict, avoided_genres: set[str]) -> bool:
    if not avoided_genres:
        return False

    genres_raw = movie.get("genres") or movie.get("genre") or ""
    if isinstance(genres_raw, list):
        genre_tokens = [str(item).strip().lower() for item in genres_raw if str(item).strip()]
    else:
        genre_tokens = [
            token.strip().lower()
            for token in str(genres_raw).split(",")
            if token.strip()
        ]

    for token in genre_tokens:
        for avoided in avoided_genres:
            if avoided in token or token in avoided:
                return True
    return False


def filter_movies(preferences: dict, movies: list[dict]) -> list[dict]:
    avoided_genres = _collect_avoided_genres(preferences)
    max_duration = _get_max_duration(preferences)
    filtered: list[dict] = []

    for movie in movies:
        if _movie_has_avoided_genre(movie, avoided_genres):
            continue
        if max_duration is not None:
            movie_duration = _extract_movie_duration_minutes(movie)
            if movie_duration is not None and movie_duration > max_duration:
                continue
        filtered.append(movie)

    return filtered


def _preferences_to_query(preferences: dict) -> str:
    def _to_words(value) -> str:
        if value is None:
            return ""
        if isinstance(value, list):
            items = [str(item).strip() for item in value if str(item).strip()]
            return ", ".join(items)
        return str(value).strip()

    def _user_sentence(label: str, user_prefs: dict) -> str:
        tone = _to_words(user_prefs.get("tone"))
        pace = _to_words(user_prefs.get("pace") or user_prefs.get("pacing"))
        avoid = _to_words(user_prefs.get("avoid_genres") or user_prefs.get("avoid"))
        runtime = _to_words(user_prefs.get("runtime") or user_prefs.get("duration"))

        wants_parts = []
        if tone:
            wants_parts.append(tone)
        if pace:
            wants_parts.append(pace)

        sentence = f"{label} wants"
        if wants_parts:
            sentence += f" a {', '.join(wants_parts)} movie"
        else:
            sentence += " a movie"

        if avoid:
            sentence += f", avoids {avoid}"
        if runtime:
            sentence += f", prefers {runtime}"

        return sentence + "."

    if not preferences:
        return "movies"

    # Two-user nested preference mode (best for couple/friend matching RAG query)
    user_a = preferences.get("userA")
    user_b = preferences.get("userB")
    if isinstance(user_a, dict) and isinstance(user_b, dict):
        query_parts = [
            _user_sentence("User A", user_a),
            _user_sentence("User B", user_b),
            "Find movies that satisfy both users.",
        ]

        combined_avoids = []
        for user_prefs in (user_a, user_b):
            avoid = user_prefs.get("avoid_genres") or user_prefs.get("avoid")
            if isinstance(avoid, list):
                combined_avoids.extend(
                    [str(item).strip() for item in avoid if str(item).strip()]
                )
            elif avoid is not None and str(avoid).strip():
                combined_avoids.append(str(avoid).strip())

        if combined_avoids:
            unique_avoids = []
            seen = set()
            for item in combined_avoids:
                normalized = item.lower()
                if normalized in seen:
                    continue
                seen.add(normalized)
                unique_avoids.append(item)
            query_parts.append(f"Exclude avoided genres: {', '.join(unique_avoids)}.")
        else:
            query_parts.append("Exclude avoided genres.")

        return " ".join(query_parts)

    parts = []
    for key, value in preferences.items():
        if value is None:
            continue
        if isinstance(value, dict):
            nested_parts = []
            for nested_key, nested_value in value.items():
                nested_text = _to_words(nested_value)
                if nested_text:
                    nested_parts.append(f"{nested_key} {nested_text}")
            if nested_parts:
                parts.append(f"{key}: {', '.join(nested_parts)}")
            continue
        if isinstance(value, str):
            cleaned = value.strip()
            if cleaned:
                parts.append(f"{key}: {cleaned}")
            continue
        if isinstance(value, list):
            cleaned_items = [str(item).strip() for item in value if str(item).strip()]
            if cleaned_items:
                parts.append(f"{key}: {', '.join(cleaned_items)}")
            continue
        parts.append(f"{key}: {value}")

    return ". ".join(parts) if parts else "movies"


def create_recommendation_session(preferences: dict, batch_size: int = 10) -> dict:
    query = _preferences_to_query(preferences)
    original_candidates = search_movies(query, limit=50)
    filtered_candidates = filter_movies(preferences, original_candidates)

    safe_batch_size = max(1, int(batch_size))
    candidates = list(filtered_candidates)

    if len(candidates) < safe_batch_size:
        seen_ids = set()
        for movie in candidates:
            movie_id = movie.get("id") or movie.get("movie_id") or movie.get("title")
            if movie_id is not None:
                seen_ids.add(str(movie_id))

        for movie in original_candidates:
            movie_id = movie.get("id") or movie.get("movie_id") or movie.get("title")
            marker = str(movie_id) if movie_id is not None else None
            if marker is not None and marker in seen_ids:
                continue

            movie_with_warning = dict(movie)
            movie_with_warning["constraint_warning"] = (
                "May violate one or more user constraints."
            )
            candidates.append(movie_with_warning)
            if marker is not None:
                seen_ids.add(marker)

    candidates = add_ai_explanations(preferences, candidates)

    first_batch = candidates[:safe_batch_size]
    session_id = str(uuid.uuid4())

    sessions[session_id] = {
        "query": query,
        "candidates": candidates,
        "current_index": len(first_batch),
    }

    return {
        "session_id": session_id,
        "movies": first_batch,
        "has_more": len(candidates) > len(first_batch),
    }


def get_more_movies(session_id: str, batch_size: int = 10) -> dict:
    session = sessions.get(session_id)
    if session is None:
        return {"error": "Session not found"}

    safe_batch_size = max(1, int(batch_size))
    start = session["current_index"]
    end = start + safe_batch_size

    next_batch = session["candidates"][start:end]
    session["current_index"] = end

    return {
        "session_id": session_id,
        "movies": next_batch,
        "has_more": session["current_index"] < len(session["candidates"]),
    }
