# 📊 Measurable Success Criteria — Film Adviser

## Criterion 1 — Recommendation Quality

The AI-generated movie recommendations achieve **≥85% user satisfaction** when tested across a manually verified set of **20 movie selection sessions**. Each session involves two users with recorded preferences and swiping feedback. Satisfaction is measured by **whether both users swipe right on at least 3 of the top 5 recommended movies**.

---

## Criterion 2 — Fallback Reliability

When the AI returns a **fairness score or recommendation with confidence below 0.75**, the **fallback UX triggers correctly in 100% of test cases** across **10 low-confidence scenario replays**. This includes:

- Amber highlight for medium-confidence movies
- Manual entry / swipe override prompt for low-confidence movies

---

## Criterion 3 — Latency

**90% of AI recommendation requests** complete **within 3 seconds end-to-end** (from "Find Movie" button click to recommendations displayed) in a **standard home internet testing environment**. This includes:

- Retrieving user preferences from the database
- Querying TMDb API for candidate movies
- Calling GPT-4.1-mini via OpenRouter for scoring and explanation

---

## Notes

- All criteria are **testable immediately** using sample user sessions and controlled low-confidence scenarios.
- Thresholds (85% satisfaction, 0.75 confidence, 3 seconds latency) are set to balance **user experience and technical feasibility**.
