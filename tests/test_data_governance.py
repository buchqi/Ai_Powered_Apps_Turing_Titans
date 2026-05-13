import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
LOG_PATH = ROOT / "logs" / "episode_logs.jsonl"

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from services.recommendation_service import (
    add_movie_to_watchlist,
    get_watchlist,
    sessions,
)


EMAIL_PATTERN = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.IGNORECASE)
PHONE_PATTERN = re.compile(
    r"\b(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})\b"
)
API_KEY_PATTERN = re.compile(r"\b(?:AIza[0-9A-Za-z_-]{20,}|sk-[0-9A-Za-z_-]{20,})\b")


def test_cross_session_watchlist_isolation():
    session_a = "governance-session-a"
    session_b = "governance-session-b"
    sessions[session_a] = {
        "preferences": {},
        "query": "",
        "candidates": [],
        "current_index": 0,
        "seen_movie_ids": set(),
        "watchlist": [],
    }
    sessions[session_b] = {
        "preferences": {},
        "query": "",
        "candidates": [],
        "current_index": 0,
        "seen_movie_ids": set(),
        "watchlist": [],
    }

    add_movie_to_watchlist(session_a, {"id": "movie-1", "title": "Inside Out"})

    assert len(get_watchlist(session_a)["watchlist"]) == 1
    assert get_watchlist(session_b)["watchlist"] == []


def test_episode_logs_do_not_contain_obvious_pii_patterns():
    if not LOG_PATH.exists():
        return

    log_text = LOG_PATH.read_text(encoding="utf-8")
    assert not EMAIL_PATTERN.search(log_text)
    assert not PHONE_PATTERN.search(log_text)
    assert not API_KEY_PATTERN.search(log_text)


def test_env_file_is_not_tracked():
    result = subprocess.run(
        ["git", "ls-files", ".env"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    )
    assert result.stdout.strip() == ""


def main() -> None:
    test_cross_session_watchlist_isolation()
    test_episode_logs_do_not_contain_obvious_pii_patterns()
    test_env_file_is_not_tracked()
    print("Data governance checks passed.")


if __name__ == "__main__":
    main()
