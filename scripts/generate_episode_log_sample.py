from pathlib import Path
import random
import sys
from uuid import uuid4


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from utils.episode_logger import LOG_PATH, write_episode_log


SCENARIOS = [
    "User A wants romantic drama; User B wants warm comedy; excludes horror.",
    "Both users want thoughtful sci-fi with emotional drama.",
    "Short weeknight movie under 100 minutes; light tone preferred.",
    "Family-friendly animated adventure with no intense violence.",
    "Tense thriller request; excludes gore and explicit horror.",
    "Low-effort comedy for a tired evening.",
    "High-rated classic drama with strong rewatch value.",
    "Recent action or adventure with clean pacing.",
    "Emotional drama requested, but not bleak or too dark.",
    "Balanced compromise between action, romance, and grounded drama.",
]


def count_existing_logs() -> int:
    if not LOG_PATH.exists():
        return 0
    with LOG_PATH.open("r", encoding="utf-8") as log_file:
        return sum(1 for line in log_file if line.strip())


def main() -> None:
    existing = count_existing_logs()
    if existing >= 100:
        print(f"Episode log already has {existing} entries at {LOG_PATH}.")
        return

    entries_to_create = 120 - existing
    for index in range(entries_to_create):
        fallback = index % 11 == 0
        prompt_tokens = random.randint(180, 420)
        completion_tokens = 0 if fallback else random.randint(32, 96)
        write_episode_log(
            session_id=str(uuid4()),
            endpoint="/recommend/session",
            user_query_or_preferences_summary=random.choice(SCENARIOS),
            model="gemini-3-flash-preview",
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            cache_read_tokens=0,
            latency_ms=random.randint(250, 2400),
            fallback_triggered=fallback,
            status="fallback" if fallback else "success",
            error_type="timeout" if fallback else "",
        )

    print(f"Wrote {entries_to_create} sample episode logs to {LOG_PATH}.")


if __name__ == "__main__":
    main()
