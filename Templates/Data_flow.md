## Feature being traced

AI-powered movie recommendation for two users (couple mode) with fairness scoring and explanation.

---

## Step 1 — User Action

The user clicks **"Find a Movie"** on the _Couple Recommendation screen_ after both partners have:

- Logged in
- Completed their preference profiles
- Optionally swiped on movies (like/dislike)

---

## Step 2 — Preprocessing

The backend performs the following before any API call:

- Retrieves from database:
  - User A preferences (genres, mood, length, intensity)
  - User B preferences
  - Couple interaction history (previous selections, fairness tracking)
  - Previously liked/disliked movies (from swipe data)

- Fetches candidate movies:
  - Calls TMDb API to retrieve ~50 movies filtered by:
    - Combined preferred genres
    - Excludes previously watched or rejected movies

- Converts data into structured format:

```json
{
  "userA": {},
  "userB": {},
  "history": {},
  "candidates": []
}

## Step 3 — Prompt Construction
System prompt
You are a movie recommendation assistant that balances preferences between two users.

Your task:
1. Score each movie for User A and User B (0–100).
2. Compute a fairness score that balances satisfaction and past compromises.
3. Recommend the top 5 movies.
4. Provide a short explanation (1–2 sentences) for each recommendation.

Return ONLY valid JSON in this format:
[
  {
    "title": "...",
    "score_userA": number,
    "score_userB": number,
    "fairness_score": number,
    "explanation": "..."
  }
]

User message content

Contains:

Preferences of both users
Fairness history
Candidate movie list with metadata

Example:
{
  "userA_preferences": {
    "genres": ["action", "sci-fi"],
    "mood": "exciting"
  },
  "userB_preferences": {
    "genres": ["romance", "drama"],
    "mood": "emotional"
  },
  "history": {
    "last_choices": ["UserA", "UserA", "UserB"]
  },
  "movies": [
    {
      "title": "Movie1",
      "genres": ["action"],
      "description": "..."
    }
  ]
}

Step 4 — API Call
* Model: openai/gpt-4.1-mini
* Route: https://openrouter.ai/api/v1/chat/completions
* Parameters:
* temperature: 0.3
* max_tokens: 1200
* response_format: json

Step 5 — Response Parsing
    The API returns:
    response.choices[0].message.content
    This is expected to be a JSON string
    Backend processing:
    Parse using json.loads()
    Extract:
    title
    score_userA
    score_userB
    fairness_score
    explanation
    Error handling:
    If parsing fails (JSONDecodeError), trigger fallback logic

Step 6 — Confidence or Validation
    Validation checks:
        JSON parsed successfully
        At least 3–5 recommendations returned
        Each movie contains all required fields
        Scores are within range (0–100)
    Decision logic:
        ✅ Valid response → show results
        ⚠️ Partial response → show with warning
        ❌ Invalid response → fallback
    Fallback behavior:
        Use backup scoring:
        score = (userA_score + userB_score) / 2
        No AI explanation is shown
```
