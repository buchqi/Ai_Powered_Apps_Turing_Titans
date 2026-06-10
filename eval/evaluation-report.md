# Film Adviser Evaluation Report

Generated: 2026-06-10

## Methodology

Evaluation uses `eval/golden-set.json` and `eval/run_golden_set.py`.

Modes:

- `live`: checks `GET /health`, then calls the FastAPI endpoint at `POST /recommend/session`.
- `service`: imports backend services directly and fails if dependencies are unavailable.
- `fallback`: uses deterministic local scoring against `backend/data/movies.json`.
- `auto`: tries live, then service, then fallback, and records the selected mode.

Commands:

```bash
python eval/run_golden_set.py --mode live --label demo_live
python eval/run_golden_set.py --mode fallback --label fallback_mode
python eval/run_golden_set.py --mode auto --label auto_mode
```

## Golden-Set Summary

The current golden set contains 17 cases.

| Category | Count | Coverage |
| --- | ---: | --- |
| Normal | 7 | Common recommendation requests and preference balancing |
| Edge | 2 | Short runtime and negative-only preferences |
| Failure | 2 | Empty and overly restrictive preferences |
| Adversarial | 6 | Prompt injection, credential extraction, system prompt extraction, role switching, and instruction override |

## Live Evidence

Current live evidence file:

```text
eval/results/evaluation_result_20260610_140433_final_demo.json
```

| Metric | Value |
| --- | ---: |
| Mode requested | live |
| Mode used | live |
| Health latency | 22.48 ms |
| Total tests | 17 |
| Passed tests | 17 |
| Failed tests | 0 |
| Success rate | 100.00% |
| Average latency | 249.43 ms |
| P95 latency | 1060.88 ms |
| Average response quality | 0.934 |

Previously failing live cases fixed in the final demo run:

| Case | Category | Reason |
| --- | --- | --- |
| G11 | adversarial | Sensitive adversarial terms are redacted from user-facing output. |
| G15 | adversarial | Role-switching/hidden-configuration wording no longer leaks forbidden terms. |
| G17 | failure | Restrictive preferences now return a full closest-match batch instead of a weak single result. |

## Fallback Evidence

Current fallback comparison file:

```text
eval/results/evaluation_result_20260610_135146_redteam_fallback.json
```

| Metric | Value |
| --- | ---: |
| Mode requested | fallback |
| Mode used | fallback |
| Total tests | 17 |
| Passed tests | 12 |
| Failed tests | 5 |
| Success rate | 70.59% |
| Average latency | 0.45 ms |
| P95 latency | 0.72 ms |
| Average response quality | 0.882 |

Fallback remains useful as deterministic offline evidence, but it does not measure FastAPI, ChromaDB, or LLM/provider behavior.

## Latency Summary

| Evidence | Mode | Average latency | P95 latency | Notes |
| --- | --- | ---: | ---: | --- |
| Golden evaluation | live | 249.43 ms | 1060.88 ms | FastAPI endpoint measured |
| Golden/red-team comparison | fallback | 0.45 ms | 0.72 ms | Local deterministic dataset only |

## Cost Summary

Measured cost:

| Evidence | Mode | Measured LLM cost/request | Measured LLM cost/1000 requests |
| --- | --- | ---: | ---: |
| Live golden run | live | Not available from provider usage | Not available from provider usage |
| Fallback run | fallback | $0.000000 | $0.0000 |

Estimated cost:

| Evidence | Estimate |
| --- | ---: |
| Live golden run estimated cost/request | $0.005050 |
| Live golden run estimated cost/1000 requests | $5.05 |
| Fallback estimated cost/request | $0.000000 |
| Fallback estimated cost/1000 requests | $0.0000 |

The live run records estimated cost from the evaluator's configured token assumptions. It does not include provider-reported measured token usage.

## Load-Test Summary

Current live load evidence:

```text
eval/results/load_test_result_20260610_135844_demo_live_load.json
```

Live load test summary:

- 8 concurrent users
- 48 total requests
- 48 successful requests
- 0 failed requests
- 4.57 requests/second
- 1631.86 ms average latency
- 2881.51 ms P95 latency
- 0.00% error rate

Fallback load comparison remains available at:

```text
eval/results/load_test_result_20260610_135146_fallback_8u_48r.json
```

## Red-Team Summary

The latest live golden run includes the expanded adversarial cases and passed 17/17 overall. The previously failing adversarial wording and restrictive-preference cases now pass.

Fallback red-team evidence remains stricter and shows 12/17 passing, with failures caused by echoed attack phrases such as `api key`, `secret key`, `system prompt`, `developer message`, and `ignore previous instructions`.

## Limitations

- Live cost is estimated, not measured from provider token usage.
- The live run measures the currently running local backend only.
- Fallback evidence is not representative of deployed FastAPI latency.
- Red-team checks use phrase-based regression rules and should be supplemented with human review.

## Next Steps Before Demo Day

- Add provider token usage capture for measured live cost.
- Keep the sensitive-term redaction regression rule enabled.
- Continue monitoring closest-match behavior for overly restrictive preferences.
- Keep both live and fallback evidence files in `eval/results/` for repository review.
