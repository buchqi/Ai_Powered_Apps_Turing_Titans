# 🔒 Safety Threats — Film Adviser

## Filled Threat Table

| Threat                           | Relevant?                                                                                                                           | Mitigation                                                                                                                                                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prompt injection                 | Yes — users can input free-form preferences or descriptions that are included in the prompt.                                        | User inputs (preferences, mood, descriptions) are inserted only in the **user message**, never in the system prompt. The system prompt is fixed and cannot be overridden. We also limit input length (e.g., 300 characters) and strip unsafe patterns.                          |
| Hallucination in recommendations | Yes — the AI may generate incorrect or misleading explanations about why a movie is recommended.                                    | We constrain the model to return **structured JSON only** and base explanations strictly on provided movie metadata. Explanations are short (1–2 sentences) and not presented as authoritative. If parsing fails, we fall back to a non-AI scoring system without explanations. |
| Bias affecting user preferences  | Yes — the model may favor popular genres or culturally dominant content (e.g., Hollywood over local films).                         | We explicitly include both users’ preferences in the prompt and instruct the model to **balance both equally**. We will test recommendations with diverse preferences and document any bias. The fairness score is designed to prevent one user’s preferences dominating.       |
| Content policy violation         | Low — users are selecting movies, not generating harmful content. However, descriptions or inputs could contain inappropriate text. | If the model refuses to generate output, the user sees a soft message: "We couldn’t process that request — try adjusting your preferences." No technical reason is shown. We log such cases for review.                                                                         |
| Privacy violation                | Yes — user preferences, viewing habits, and couple interactions are personal data.                                                  | We store only necessary data (preferences, swipe history, fairness logs). We do not store sensitive personal information. We provide a clear notice: "Your preferences are used only to improve recommendations." Users can delete their account and data.                      |
| Data exfiltration                | Low — the system does not expose one user’s data to another.                                                                        | Each API call includes only the current session’s data (two users in a couple). No global database data or other users’ information is included in prompts. System prompts contain no secrets or API keys.                                                                      |
| Over-reliance on AI decisions    | Partial — users might blindly trust recommendations even if they don’t match real preferences.                                      | The UI encourages interaction (swiping) rather than blind acceptance. Users can always override recommendations. We avoid language like "best choice" and instead use neutral phrasing like "suggested for you."                                                                |

---

## Top Risk Statement

Our biggest safety concern is **privacy**, because the system stores user preferences, viewing habits, and couple interaction history over time.

We address this by:

- Storing only necessary data (no sensitive personal information)
- Keeping all data scoped to individual users or pairs
- Allowing users to delete their data
- Clearly informing users that their data is used only for recommendations
