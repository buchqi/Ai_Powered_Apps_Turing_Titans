import concurrent.futures
import time
from dataclasses import dataclass
from typing import Callable, Generic, TypeVar


T = TypeVar("T")


@dataclass
class LLMCallResult(Generic[T]):
    value: T
    fallback_triggered: bool
    status: str
    error_type: str
    latency_ms: int


def _run_with_timeout(call: Callable[[], T], timeout_seconds: float) -> T:
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    future = executor.submit(call)
    try:
        return future.result(timeout=timeout_seconds)
    finally:
        executor.shutdown(wait=False, cancel_futures=True)


def call_with_resilience(
    call: Callable[[], T],
    *,
    fallback_value: T,
    timeout_seconds: float = 12,
    max_retries: int = 2,
    initial_backoff_seconds: float = 0.5,
) -> LLMCallResult[T]:
    start = time.perf_counter()
    attempts = max(1, int(max_retries) + 1)
    last_error_type = ""

    for attempt in range(attempts):
        try:
            value = _run_with_timeout(call, timeout_seconds)
            latency_ms = int((time.perf_counter() - start) * 1000)
            return LLMCallResult(
                value=value,
                fallback_triggered=False,
                status="success",
                error_type="",
                latency_ms=latency_ms,
            )
        except concurrent.futures.TimeoutError:
            last_error_type = "timeout"
        except Exception as exc:
            last_error_type = exc.__class__.__name__

        if attempt < attempts - 1:
            time.sleep(initial_backoff_seconds * (2**attempt))

    latency_ms = int((time.perf_counter() - start) * 1000)
    return LLMCallResult(
        value=fallback_value,
        fallback_triggered=True,
        status="fallback",
        error_type=last_error_type or "llm_error",
        latency_ms=latency_ms,
    )
