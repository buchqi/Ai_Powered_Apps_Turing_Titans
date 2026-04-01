# Capstone Design Review — Film Adviser

**Course:** CS-AI-2025 — Building AI-Powered Applications | Spring 2026  
**Assessment:** Design Review — 10 points  
**Due:** Thursday 2 April 2026 at 23:59 Georgia Time  
**Submission:** Team repo + Google Form  
**Team:** Turing Titans  
**Project:** Film Adviser — AI-Powered Movie Recommendations for Couples  
**Repo:** https://github.com/buchqi/Ai_Powered_Apps_Turing_Titans.git

---

## Section 1 — Problem Statement and Users

**Problem statement (one sentence):**  
Couples struggle to pick a movie together because their tastes often conflict and current streaming platforms offer no fair balancing of preferences, which means they spend excessive time scrolling, experience indecision, and sometimes argue.

**Who exactly has this problem:**  
Two partners sitting at home on a weekend evening, wanting to watch a movie together. We interviewed one couple, who reported spending 20–30 minutes scrolling multiple streaming apps, often compromising on suboptimal choices.

**What they do today without your solution:**  
Manually browse streaming platforms, individually pick genres, argue over suggestions, or settle on whatever appears first.

**Why AI is the right tool:**  
AI enables dynamic scoring and fairness balancing between two users’ preferences, which is not feasible manually. Conventional filters can’t reconcile nuanced mood, genre, and fairness history simultaneously, whereas AI can recommend movies that satisfy both users and provide explanations, improving speed, personalization, and satisfaction.

---

## Section 2 — Proposed Solution and Features

**Solution summary:**  
Film Adviser is a web application that allows two users to find movies they’ll both enjoy. Each user inputs their preferences and optionally swipes on candidate movies. The backend queries a movie database (TMDb) and uses AI to score each movie for each user, compute fairness scores, and generate short explanations. Users see the top recommended movies as swipeable cards. The system also provides fallback recommendations if AI is unavailable or low-confidence.

**Core features:**

| Feature                                    | AI-powered? | AI differentiator?                               |
| ------------------------------------------ | ----------- | ------------------------------------------------ |
| Movie scoring and fairness computation     | ✅          | Balances two users’ preferences using AI         |
| Explanation generation for recommendations | ✅          | Generates short 1–2 sentence reasoning per movie |
| Tinder-style swipe interface               | ❌          | UI only; AI not involved                         |
| Candidate movie selection from TMDb        | ❌          | Standard filtering                               |
| Fallback recommendation logic              | ❌          | Basic averaging scoring if AI fails              |

**The one feature that would not exist without AI:**  
Fairness-balanced scoring and explanation generation for couples’ movie preferences.

---

## Section 3 — Measurable Success Criteria

| Criterion              | How you will measure it                                                                                              | Target              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Recommendation Quality | Record 20 sessions with two users; check if both swipe right on at least 3 of top 5 AI-recommended movies            | ≥85% satisfaction   |
| Fallback Reliability   | Simulate 10 low-confidence AI responses; check that fallback UX triggers correctly (amber highlight, swipe override) | 100% correctness    |
| Latency                | Measure time from "Find Movie" click to recommendations displayed, including DB query, TMDb call, AI scoring         | 90% under 3 seconds |

---

## Section 4 — Architecture

**Architecture diagram:** `docs/design-review/architecturepng.png`

**Technology stack:**

| Layer                      | Technology                           | Why                                                             |
| -------------------------- | ------------------------------------ | --------------------------------------------------------------- |
| Frontend                   | React + Tailwind (Vercel)            | Fast UI development, ideal for interactive swipe interface      |
| Backend                    | FastAPI (Python, Railway EU)         | Fast API development, good for AI integration                   |
| Primary AI model           | OpenAI GPT-4.1-mini via OpenRouter   | Structured JSON output, reasoning, fairness scoring             |
| Secondary model (fallback) | Gemini 3 Flash via OpenRouter        | Easy fallback with a config change                              |
| Storage                    | Supabase Postgres (EU)               | Stores user profiles, preferences, swipe history, fairness logs |
| Hosting                    | Vercel (frontend), Railway (backend) | Free tier, fast CI/CD deployment                                |

**Multimodal capabilities (planned by Week 8):**

- ✅ Text generation
- ❌ Vision / image understanding
- ❌ Image generation
- ❌ Audio TTS/STT
- ❌ Document/PDF understanding
- ❌ Function calling
- ❌ RAG

---

## Section 5 — Prompt and Data Flow

**User action:**  
User clicks "Find a Movie" on the Couple Recommendation screen after both partners logged in, set preferences, and optionally swiped.

**Preprocessing:**  
Backend retrieves user preferences, couple interaction history, and previously liked/disliked movies. Fetches ~50 candidate movies from TMDb filtered by combined genres and excludes previously watched/rejected movies. Structures data as JSON.

**Prompt construction:**  
System prompt instructs AI to score each movie for both users, compute fairness, recommend top 5, and provide explanations. User preferences, history, and candidate movies are inserted into the user message only.

**API call:**  
Model: `openai/gpt-4.1-mini` via OpenRouter  
Parameters: `temperature=0.3`, `max_tokens=1200`, response expected in JSON

**Response parsing:**  
Parse `response.choices[0].message.content` using `json.loads()`. Extract `title`, `score_userA`, `score_userB`, `fairness_score`, `explanation`. If parsing fails, trigger fallback logic.

**Confidence / validation:**  
Check that JSON contains ≥3 movies with valid fields, scores between 0–100.

- ✅ Valid → show results
- ⚠️ Partial → show with warning
- ❌ Invalid → use backup scoring (average of user scores, no explanation)

**User output:**  
The user sees top 5 recommendations as swipeable cards with explanations. If AI fails, fallback cards appear with soft banner:  
_"We couldn’t generate smart recommendations right now — showing best matches instead."_  
Medium-confidence movies show an amber label; low-confidence movies appear faded with a message:  
_"Not sure about this one — you can skip"_

---

## Section 6 — Team Roles and Contract

| Name                | Primary role               |
| ----------          | -------------------------- |
| Gela Lomidze        | Frontend / UI              |
| Giorgi Tkebuchava   | Backend / AI Integration   |
| Ivane Urjumelashvili| Database / Data Governance |

**Team Contract:** Committed to repo root as `TEAM-CONTRACT.md`  
Link: https://github.com/buchqi/Ai_Powered_Apps_Turing_Titans/blob/main/TEAM-CONTRACT.md

---

## Section 7 — Safety Threats and Fallback UX

| Threat                              | Relevant? | Mitigation                                                                                            |
| ----------------------------------- | --------- | ----------------------------------------------------------------------------------------------------- |
| Prompt injection                    | Yes       | Insert user input only in user message, limit input length, sanitize patterns                         |
| Hallucination in high-stakes output | Yes       | Constrain model to return structured JSON, fallback to non-AI scoring if parsing fails                |
| Bias affecting specific user groups | Yes       | Include both users’ preferences in prompt, test diverse scenarios, fairness score prevents domination |
| Content policy violation            | Low       | If model refuses output, show soft message, no technical explanation                                  |
| Privacy violation                   | Yes       | Store only preferences, swipe history, fairness logs; no sensitive data; allow deletion               |
| Data exfiltration                   | Low       | API calls include only session data, no global user data; system prompts contain no secrets           |

**Top risk statement:**  
Privacy is the biggest risk because user preferences and swipe history are personal; we mitigate by storing only necessary data, scoping it to users or pairs, and allowing deletion.

**Fallback UX:**  
The user sees recommendations (or amber/highlighted indicators) and can continue swiping or try again. No technical error messages are shown; phrasing is human-friendly and avoids mentioning AI.

---

## Section 8 — Data Governance

| Question                                                         | Answer                                                                           |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| What user data does your app collect or process?                 | Preferences, swipe history, fairness logs, couple interaction history            |
| Where is it stored?                                              | Supabase Postgres (EU region)                                                    |
| How long is it retained?                                         | Until the user deletes the account; history older than 1 year may be anonymized  |
| Who has access to it?                                            | Backend services, team for maintenance, not shared externally                    |
| How can a user request deletion?                                 | Via settings page or contacting support; deletes user and couple data            |
| Does your app send user data to third-party AI APIs? Which ones? | Yes — OpenAI GPT-4.1-mini via OpenRouter and Gemini 3 Flash for fallback scoring |

---

## Section 9 — IRB-Light Checklist

None of the following apply:

- App does not collect images, audio, PHI, financial info, documents, or involve users under 18.

---
