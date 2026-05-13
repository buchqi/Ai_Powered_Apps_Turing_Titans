import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


LOG_PATH = Path(__file__).resolve().parents[2] / "logs" / "episode_logs.jsonl"

EMAIL_PATTERN = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
PHONE_PATTERN = re.compile(
    r"\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})\b"
)
API_KEY_PATTERN = re.compile(
    r"\b(?:AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{20,}|[A-Za-z0-9_-]{32,})\b"
)


def sanitize_text(value: Any) -> str:
    text = "" if value is None else str(value)
    text = EMAIL_PATTERN.sub("[redacted-email]", text)
    text = PHONE_PATTERN.sub("[redacted-phone]", text)
    text = API_KEY_PATTERN.sub("[redacted-secret]", text)
    return " ".join(text.split())


def summarize_preferences(preferences: dict | None, max_items: int = 12) -> str:
    if not preferences:
        return "No preferences provided."

    parts: list[str] = []

    def collect(prefix: str, value: Any) -> None:
        if len(parts) >= max_items:
            return
        if isinstance(value, dict):
            for nested_key, nested_value in value.items():
                collect(f"{prefix}.{nested_key}" if prefix else str(nested_key), nested_value)
            return
        if isinstance(value, list):
            value_text = ", ".join(sanitize_text(item) for item in value[:4])
        else:
            value_text = sanitize_text(value)
        if value_text:
            parts.append(f"{prefix}: {value_text[:80]}")

    collect("", preferences)
    return "; ".join(parts) if parts else "No preferences provided."


def write_episode_log(
    *,
    session_id: str,
    endpoint: str,
    user_query_or_preferences_summary: str,
    model: str,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    total_tokens: int = 0,
    cache_read_tokens: int = 0,
    latency_ms: int = 0,
    fallback_triggered: bool = False,
    status: str = "success",
    error_type: str = "",
) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "session_id": sanitize_text(session_id) or "unknown",
        "endpoint": sanitize_text(endpoint),
        "user_query_or_preferences_summary": sanitize_text(user_query_or_preferences_summary),
        "model": sanitize_text(model),
        "prompt_tokens": int(prompt_tokens or 0),
        "completion_tokens": int(completion_tokens or 0),
        "total_tokens": int(total_tokens or 0),
        "cache_read_tokens": int(cache_read_tokens or 0),
        "latency_ms": int(latency_ms or 0),
        "fallback_triggered": bool(fallback_triggered),
        "status": sanitize_text(status) or "unknown",
        "error_type": sanitize_text(error_type),
    }

    with LOG_PATH.open("a", encoding="utf-8") as log_file:
        log_file.write(json.dumps(entry, ensure_ascii=True) + "\n")
