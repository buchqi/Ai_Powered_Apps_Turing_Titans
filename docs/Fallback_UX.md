# ⚠️ Fallback UX — Film Adviser

## Scenario A — AI API Failure (timeout, network issue, or server error)

The user sees a **soft banner at the top of the recommendation screen** with the message:

> "We couldn’t generate smart recommendations right now — showing best matches instead."

The movie cards still appear using a basic matching algorithm. The user can:

- Continue swiping normally
- Click a **"Try again"** button to regenerate AI recommendations

Their preferences and swipe history are **never lost** and remain applied.

We do not show:

- Error codes (e.g., 500, timeout)
- Technical messages
- The word "error"

---

## Scenario B — Low-Confidence AI Recommendations

The user sees movie recommendation cards as usual, but with subtle indicators:

- Movies with **high confidence** appear normally
- Movies with **medium confidence** show a small label:

  > "Might not be a perfect match — check details"

- Movies with **low confidence**:
  - Appear slightly faded
  - Include the message:
    > "Not sure about this one — you can skip"

The user can:

- Swipe normally (left/right)
- Ignore low-confidence suggestions without friction

We never hide recommendations completely — the user always has options.

We do not show:

- Confidence scores (numbers like 0.63)
- AI uncertainty language (e.g., "model unsure", "low probability")

---

## Scenario C — No Good Matches Found

If the system cannot find strong matches for both users:

The user sees a **centered message above the movie cards**:

> "We’re having trouble finding something you’ll both love — try adjusting your preferences."

Below the message:

- A **"Adjust Preferences"** button opens the preference form
- A few **backup movie suggestions** are still shown (less personalized)

The user can:

- Update preferences
- Continue swiping anyway

Their existing data is preserved.

We do not show:

- "No results found"
- Empty screens
- Technical explanations of why matching failed

---

## Key UX Principles Applied

- The user always sees **something usable**
- The user always has a **next action**
- The user’s data is **never lost**
- No technical language or internal errors are exposed
- AI uncertainty is communicated in **human-friendly terms**
