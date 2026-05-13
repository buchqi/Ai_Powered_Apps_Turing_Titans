import re
import uuid

from services.ai_service import add_ai_explanations


sessions: dict[str, dict] = {}

NEGATIVE_FIELD_NAMES = (
    "avoid",
    "dealbreaker",
    "exclude",
    "dislike",
    "no_",
    "not",
)


def get_movie_key(movie: dict) -> str:
    key = movie.get("id") or movie.get("movie_id") or movie.get("title") or ""
    return str(key).strip().lower()


def append_unique_movies(current_movies: list, incoming_movies: list) -> list:
    seen = {get_movie_key(movie) for movie in current_movies if get_movie_key(movie)}
    combined = list(current_movies)

    for movie in incoming_movies:
        key = get_movie_key(movie)
        if not key or key in seen:
            continue
        seen.add(key)
        combined.append(movie)

    return combined


def _as_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, list):
        return " ".join(str(item).strip() for item in value if str(item).strip())
    return str(value).strip()


def _is_negative_field(field_name: str) -> bool:
    normalized = str(field_name).strip().lower()
    return any(token in normalized for token in NEGATIVE_FIELD_NAMES)


def _looks_like_negative_preference(value) -> bool:
    text = _as_text(value).lower()
    return bool(re.search(r"\b(no|avoid|exclude|without|not)\b", text))


def _positive_preference_words(user_prefs: dict) -> list[str]:
    words: list[str] = []

    for field, value in user_prefs.items():
        if value is None or _is_negative_field(field) or _looks_like_negative_preference(value):
            continue

        if isinstance(value, dict):
            words.extend(_positive_preference_words(value))
            continue

        text = _as_text(value)
        if text:
            words.append(text)

    return words


def _preferences_to_query(preferences: dict) -> str:
    if not preferences:
        return "movies"

    query_parts: list[str] = []
    user_a = preferences.get("userA")
    user_b = preferences.get("userB")

    if isinstance(user_a, dict):
        query_parts.extend(_positive_preference_words(user_a))
    if isinstance(user_b, dict):
        query_parts.extend(_positive_preference_words(user_b))

    if not query_parts:
        for field, value in preferences.items():
            if _is_negative_field(field) or _looks_like_negative_preference(value):
                continue
            if isinstance(value, dict):
                query_parts.extend(_positive_preference_words(value))
                continue
            text = _as_text(value)
            if text:
                query_parts.append(text)

    return " ".join(query_parts) if query_parts else "movies"


def _collect_avoided_genres(preferences: dict) -> set[str]:
    avoided: set[str] = set()

    def _collect(value) -> None:
        if value is None:
            return
        if isinstance(value, list):
            for item in value:
                _collect(item)
            return

        text = str(value).strip().lower()
        if not text:
            return

        cleaned = re.sub(r"^(no|avoid|exclude|without)\s+", "", text).strip()
        if cleaned and "no limits" not in cleaned and cleaned not in {"limits", "limit", "none"}:
            avoided.add(cleaned)

    for key, value in preferences.items():
        key_text = str(key).lower()
        if isinstance(value, dict):
            for nested_key, nested_value in value.items():
                nested_key_text = str(nested_key).lower()
                if _is_negative_field(nested_key_text):
                    _collect(nested_value)
        elif _is_negative_field(key_text):
            _collect(value)

    return avoided


def _get_max_duration(preferences: dict) -> int | None:
    duration_texts: list[str] = []

    def _collect_duration_texts(value) -> None:
        if value is None:
            return
        if isinstance(value, list):
            for item in value:
                _collect_duration_texts(item)
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
            return int(float(hours_match.group(2)) * 60)

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


def filter_movies(preferences: dict, candidates: list[dict]) -> list[dict]:
    avoided_genres = _collect_avoided_genres(preferences)
    max_duration = _get_max_duration(preferences)
    filtered: list[dict] = []

    for movie in candidates:
        if _movie_has_avoided_genre(movie, avoided_genres):
            continue
        if max_duration is not None:
            movie_duration = _extract_movie_duration_minutes(movie)
            if movie_duration is not None and movie_duration > max_duration:
                continue
        filtered.append(movie)

    return filtered


def _has_unseen_movies(session: dict) -> bool:
    seen_movie_ids = session["seen_movie_ids"]
    return any(
        get_movie_key(movie) not in seen_movie_ids
        for movie in session["candidates"][session["current_index"]:]
    )


def create_recommendation_session(preferences: dict, batch_size: int = 10) -> dict:
    from services.rag_service import search_movies

    safe_batch_size = max(1, int(batch_size))
    session_id = str(uuid.uuid4())
    query = _preferences_to_query(preferences)
    original_candidates = search_movies(query, limit=50)
    filtered_candidates = filter_movies(preferences, original_candidates)
    candidates = add_ai_explanations(
        preferences,
        append_unique_movies([], filtered_candidates),
        session_id=session_id,
        endpoint="/recommend/session",
    )

    first_batch = candidates[:safe_batch_size]
    seen_movie_ids = {
        get_movie_key(movie)
        for movie in first_batch
        if get_movie_key(movie)
    }
    sessions[session_id] = {
        "preferences": preferences,
        "query": query,
        "candidates": candidates,
        "current_index": len(first_batch),
        "seen_movie_ids": seen_movie_ids,
        "watchlist": [],
        "fallback_triggered": any(
            "stronger match for your preferences" in str(movie.get("match_reason", ""))
            or "weaker match" in str(movie.get("match_reason", ""))
            for movie in candidates
        ),
    }

    return {
        "session_id": session_id,
        "movies": first_batch,
        "has_more": _has_unseen_movies(sessions[session_id]),
    }


def get_more_movies(session_id: str, batch_size: int = 10) -> dict:
    session = sessions.get(session_id)
    if session is None:
        return {"error": "Session not found"}

    safe_batch_size = max(1, int(batch_size))
    candidates = session["candidates"]
    next_batch: list[dict] = []

    while session["current_index"] < len(candidates) and len(next_batch) < safe_batch_size:
        movie = candidates[session["current_index"]]
        session["current_index"] += 1

        key = get_movie_key(movie)
        if not key or key in session["seen_movie_ids"]:
            continue

        session["seen_movie_ids"].add(key)
        next_batch.append(movie)

    return {
        "session_id": session_id,
        "movies": next_batch,
        "has_more": _has_unseen_movies(session),
    }


def add_movie_to_watchlist(session_id: str, movie: dict) -> dict:
    session = sessions.get(session_id)
    if session is None:
        return {"error": "Session not found", "watchlist": []}

    session["watchlist"] = append_unique_movies(session["watchlist"], [movie])
    return {
        "session_id": session_id,
        "watchlist": session["watchlist"],
    }


def remove_movie_from_watchlist(session_id: str, movie_id: str) -> dict:
    session = sessions.get(session_id)
    if session is None:
        return {"error": "Session not found", "watchlist": []}

    normalized_id = str(movie_id).strip().lower()
    session["watchlist"] = [
        movie
        for movie in session["watchlist"]
        if get_movie_key(movie) != normalized_id
    ]

    return {
        "session_id": session_id,
        "watchlist": session["watchlist"],
    }


def get_watchlist(session_id: str) -> dict:
    session = sessions.get(session_id)
    if session is None:
        return {"error": "Session not found", "watchlist": []}

    return {
        "session_id": session_id,
        "watchlist": session["watchlist"],
    }
