# Film Adviser Load Test Report

Generated: 2026-06-10

## Methodology

Load testing uses `eval/run_load_test.py`.

Commands:

```bash
python eval/run_load_test.py --mode live --users 8 --requests 48 --label demo_live_load
python eval/run_load_test.py --mode fallback --users 8 --requests 48 --label fallback_8u_48r
```

`live` mode targets only the running FastAPI endpoint at `http://127.0.0.1:8000/recommend/session`. It does not silently fall back.

`fallback` mode targets only deterministic local scoring over `backend/data/movies.json`.

## Golden-Set Summary

The load test reuses the 17-case golden set as its request mix, including normal, edge, failure, and adversarial inputs.

## Live HTTP Evidence

Current live evidence file:

```text
eval/results/load_test_result_20260610_135844_demo_live_load.json
```

| Metric | Value |
| --- | ---: |
| Mode | live |
| Concurrent users | 8 |
| Total requests | 48 |
| Successful requests | 48 |
| Failed requests | 0 |
| Duration | 10.496 seconds |
| Throughput | 4.57 requests/second |
| Average latency | 1631.86 ms |
| P50 latency | 1697.20 ms |
| P90 latency | 2794.37 ms |
| P95 latency | 2881.51 ms |
| P99 latency | 2957.50 ms |
| Peak latency | 2957.50 ms |
| Error rate | 0.00% |

This run is successful live FastAPI load evidence for the local backend process.

## Fallback Evidence

Fallback comparison file:

```text
eval/results/load_test_result_20260610_135146_fallback_8u_48r.json
```

| Metric | Value |
| --- | ---: |
| Mode | fallback |
| Concurrent users | 8 |
| Total requests | 48 |
| Successful requests | 48 |
| Failed requests | 0 |
| Duration | 0.028 seconds |
| Throughput | 1704.17 requests/second |
| Average latency | 3.07 ms |
| P50 latency | 2.99 ms |
| P90 latency | 4.15 ms |
| P95 latency | 4.48 ms |
| P99 latency | 5.02 ms |
| Peak latency | 5.02 ms |
| Error rate | 0.00% |

Fallback remains a deterministic baseline only. It bypasses HTTP, ChromaDB, and LLM/provider work.

## Cost Summary

Measured cost:

- Live load test: provider-measured token cost was not captured.
- Fallback load test: $0 measured LLM cost.

Estimated cost:

- Live estimated cost/request: $0.005050.
- Live estimated cost/1000 requests: $5.05.
- Fallback estimated cost/request: $0.000000.

## Limitations

- Live load was measured against a local backend, not a production deployment.
- Provider token usage was not captured, so live cost remains estimated.
- Fallback load performance should not be compared directly to live latency because it avoids HTTP and retrieval dependencies.

## Next Steps Before Demo Day

- Repeat the live load test once more after final code freeze.
- Capture provider token usage for measured LLM cost.
- Add p95 target tracking to the README or evaluation report.
- Preserve both live and fallback load result files in `eval/results/`.
