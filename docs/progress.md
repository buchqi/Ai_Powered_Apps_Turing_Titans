# Film Adviser Progress and Architecture

This document explains the current Film Adviser project in a beginner-friendly way. It is meant to be readable after a long break from the codebase, so it describes what the app does, how the frontend and backend fit together, what each important file owns, and what still needs improvement.

## 1. Project Overview

Film Adviser is a movie recommendation app for two people who want to choose a film together.

The basic idea is simple:

1. User A answers a short movie preference quiz.
2. User B answers the same quiz.
3. The frontend sends both preference profiles to the backend.
4. The backend searches a movie vector database and returns recommendations that should fit both users.
5. The users swipe through movie cards.
6. Liked movies are saved into a session watchlist.

The problem it solves is the familiar "what should we watch?" problem. Two people often have different moods, genres, and dealbreakers. Film Adviser tries to find overlap instead of letting one person's taste dominate.

The app uses AI and RAG because normal keyword search is too rigid. RAG means Retrieval-Augmented Generation. In this project:

- Retrieval comes from ChromaDB vector search over movie documents.
- Filtering removes movies that violate hard constraints.
- AI explanation generation adds a human-readable reason for each match.

The result is not just a list of movies. Each movie can include a `match_reason` explaining why it was recommended.

## 2. Current Architecture

### Frontend

The frontend is a React app built with Vite.

Main frontend parts:

- React renders the UI.
- React Router handles pages like `/`, `/match`, `/watchlist`, and `/about`.
- `Home.jsx` contains the preference quiz and match page flow.
- `PreferenceCard.jsx` renders each user's quiz.
- `MovieSwiper.jsx` handles the swipe-card experience.
- `MovieCard.jsx` displays each movie poster and recommendation details.
- `Watchlist.jsx` displays movies saved in the current backend session.
- `src/api/recommendations.js` contains raw API calls to the FastAPI backend.

The frontend should stay mostly UI-focused. It collects answers, calls backend endpoints, displays movie objects returned by the backend, and sends like/remove actions to the backend.

### Backend

The backend is a FastAPI app.

Main backend parts:

- `main.py` defines API endpoints and request models.
- `services/recommendation_service.py` owns recommendation sessions, query creation, filtering, pagination, duplicate prevention, and in-memory watchlists.
- `services/rag_service.py` searches ChromaDB.
- `services/ai_service.py` adds AI-generated or fallback match explanations.
- `scripts/ingest_movies.py` builds the ChromaDB collection from `data/movies.json`.
- `scripts/fetch_posters.py` can fetch real TMDB poster URLs into `movies.json`.
- `static/placeholder-poster.svg` is served by FastAPI as a fallback poster.
- `vector_db/chroma` stores ChromaDB data.

### Data Storage

Current storage is mixed:

- Movie source data lives in `backend/data/movies.json`.
- Vector embeddings and movie metadata live in `backend/vector_db/chroma`.
- Recommendation sessions and watchlists live in Python memory inside `recommendation_service.py`.

Because sessions are in memory, they disappear when the backend restarts.

## 3. Full User Flow

1. The user opens the app in the browser.
2. The landing page introduces Film Adviser.
3. The user navigates to `/match`.
4. User A completes the preference quiz.
5. User B unlocks and completes the preference quiz.
6. `Home.jsx` sends both users' preferences to `POST /recommend/session`.
7. FastAPI receives the request in `main.py`.
8. `create_recommendation_session()` creates a clean RAG query from positive preferences.
9. `search_movies()` searches ChromaDB for candidate movies.
10. `filter_movies()` removes movies that violate hard constraints.
11. `add_ai_explanations()` adds `match_reason` to each movie.
12. The backend stores a recommendation session in memory.
13. The backend returns the first batch of movies.
14. `MovieSwiper.jsx` displays the returned movies as swipeable cards.
15. When the user likes a movie, `Home.jsx` calls `POST /watchlist/add`.
16. The backend stores the liked movie in the session watchlist.
17. When the swiper is nearly out of cards, it asks `Home.jsx` to load more.
18. `Home.jsx` calls `POST /recommend/more`.
19. The backend returns the next batch from the same session.
20. The user can open `/watchlist`.
21. `Watchlist.jsx` calls `GET /watchlist/{session_id}`.
22. The backend returns saved movies for that session.

## 4. Backend Files and Responsibilities

### `backend/main.py`

Purpose:

`main.py` is the FastAPI entrypoint. It creates the `FastAPI()` app, configures CORS, mounts static files, defines Pydantic request models, and exposes HTTP endpoints.

Important classes:

- `UserPreferences`
- `MatchRequest`
- `RecommendationSessionRequest`
- `MoreRecommendationsRequest`
- `WatchlistAddRequest`
- `WatchlistRemoveRequest`

Important routes:

- `POST /recommend/session`
- `POST /recommend/more`
- `POST /watchlist/add`
- `POST /watchlist/remove`
- `GET /watchlist/{session_id}`
- `POST /api/match`

Input:

HTTP request bodies from the frontend or Swagger UI.

Output:

JSON responses from service functions.

Connections:

`main.py` imports service functions from `services/recommendation_service.py`.

It also mounts:

```py
app.mount("/static", StaticFiles(directory="static"), name="static")
```

This makes `static/placeholder-poster.svg` available at:

```text
http://127.0.0.1:8000/static/placeholder-poster.svg
```

Currently, `GET /health` does not exist in `main.py`.

### `backend/services/recommendation_service.py`

Purpose:

This is the main recommendation orchestration file. It owns the backend-side recommendation state and logic.

Important data:

```py
sessions: dict[str, dict] = {}
```

Session shape currently appears to be:

```py
{
    "preferences": preferences,
    "query": query,
    "candidates": candidates,
    "current_index": len(first_batch),
    "seen_movie_ids": seen_movie_ids,
    "watchlist": [],
}
```

Input:

- Raw preference objects from the frontend.
- Session IDs from later pagination/watchlist requests.
- Movie objects liked by the user.

Output:

- Recommendation session JSON.
- More movie batches.
- Watchlist JSON.

Connections:

It imports:

```py
from services.ai_service import add_ai_explanations
from services.rag_service import search_movies
```

### `backend/services/rag_service.py`

Purpose:

This file connects to ChromaDB and searches movie embeddings by semantic similarity.

Important constants:

```py
COLLECTION_NAME = "movies"
CHROMA_PATH = backend/vector_db/chroma
PLACEHOLDER_POSTER_URL = "http://127.0.0.1:8000/static/placeholder-poster.svg"
```

Important function:

```py
search_movies(query: str, limit: int = 10) -> list[dict]
```

Input:

A text query such as:

```text
Dark & intense Balanced Real world drama Slow burn
```

Output:

A list of movie dictionaries with metadata:

```py
{
    "id": "...",
    "title": "...",
    "year": 2014,
    "genres": "Thriller, Crime, Drama",
    "duration": 117,
    "rating": 7.8,
    "poster_url": "https://image.tmdb.org/t/p/w500/...",
    "document": "...",
    "distance": 1.14,
}
```

Connections:

It reads the Chroma collection created by `scripts/ingest_movies.py`.

### `backend/services/ai_service.py`

Purpose:

This file adds human-readable explanations to recommended movies.

Important function:

```py
add_ai_explanations(preferences: dict, movies: list[dict]) -> list[dict]
```

Input:

- User preferences.
- Movie dictionaries from RAG/filtering.

Output:

The same movie dictionaries plus:

```py
"match_reason": "Nightcrawler is a stronger match because..."
```

Important behavior:

`add_ai_explanations()` preserves movie fields by copying each full movie:

```py
movie_with_reason = dict(movie)
movie_with_reason["match_reason"] = ...
```

That means fields like `poster_url`, `rating`, `duration`, and `genres` are not lost.

If `GEMINI_API_KEY` is missing or the AI call fails, it uses a fallback explanation.

### `backend/scripts/ingest_movies.py`

Purpose:

This script converts `data/movies.json` into ChromaDB documents, embeddings, and metadata.

Important function:

```py
build_movie_document(movie: dict) -> str
```

It creates searchable text like:

```text
Title: Nightcrawler. Year: 2014. Genres: Thriller, Crime, Drama. Description: ... Duration: 117 minutes. Rating: 7.8.
```

Main ingestion flow:

1. Load `backend/data/movies.json`.
2. Create a ChromaDB persistent client at `backend/vector_db/chroma`.
3. Delete the old `movies` collection if it exists.
4. Create or get the `movies` collection.
5. Build one text document per movie.
6. Store metadata for each movie.
7. Insert documents and metadata into ChromaDB.

Metadata includes:

```py
{
    "id": str(movie.get("id", "")),
    "title": str(movie.get("title", "")),
    "year": int(movie.get("year", 0)),
    "genres": genres_text,
    "duration": int(movie.get("duration", 0)),
    "rating": float(movie.get("rating", 0.0)),
    "poster_url": str(movie.get("poster_url") or PLACEHOLDER_POSTER_URL),
}
```

The current script has a fallback poster guard, so empty `poster_url` values become the static placeholder.

### `backend/scripts/fetch_posters.py`

Purpose:

This script updates `backend/data/movies.json` with real TMDB poster URLs.

Important function:

```py
fetch_poster_url(api_key: str, title: str, year) -> str | None
```

TMDB search flow:

1. Load `TMDB_API_KEY` from environment variables. The current script also calls `load_dotenv()`, so it can read from a `.env` file if `python-dotenv` is installed.
2. For each movie in `movies.json`, read `title` and `year`.
3. Call TMDB's movie search endpoint.
4. Choose the best result with a poster path.
5. Build the poster URL:

```text
https://image.tmdb.org/t/p/w500{poster_path}
```

Fallback behavior:

If `TMDB_API_KEY` is missing, it prints:

```text
TMDB_API_KEY not found. Cannot fetch posters automatically.
movies.json was not changed.
```

If a specific movie has no poster, it stores:

```text
http://127.0.0.1:8000/static/placeholder-poster.svg
```

Important:

After running this script, ChromaDB must be rebuilt with `scripts/ingest_movies.py`.

### `backend/data/movies.json`

Purpose:

This is the source dataset for movies.

Each movie currently includes fields like:

```json
{
  "id": "1",
  "title": "Inception",
  "year": 2010,
  "genres": ["Sci-Fi", "Thriller", "Action"],
  "description": "...",
  "duration": 148,
  "rating": 8.8,
  "poster_url": "https://image.tmdb.org/t/p/w500/..."
}
```

Input:

Edited manually or updated by `scripts/fetch_posters.py`.

Output:

Used by `scripts/ingest_movies.py` to build ChromaDB.

### `backend/static/placeholder-poster.svg`

Purpose:

This is the local fallback image shown when a movie does not have a real poster or an image URL fails.

It is served by FastAPI at:

```text
http://127.0.0.1:8000/static/placeholder-poster.svg
```

### `backend/vector_db/chroma`

Purpose:

This folder stores ChromaDB's persistent vector database.

It includes:

- Embedded movie documents.
- Chroma collection data.
- Movie metadata such as `title`, `genres`, `rating`, and `poster_url`.

Important:

If `movies.json` changes, ChromaDB does not automatically update. You must delete/rebuild `vector_db/chroma`.

### `.env`

Purpose:

Currently appears to be the expected local place for real environment variables.

Important variables:

```text
GEMINI_API_KEY=real_key_here
TMDB_API_KEY=real_key_here
```

Never commit real keys.

### `.env.example`

Purpose:

This file exists at the project root and should contain placeholder environment variables only.

Currently it appears to be empty. A useful future version would include:

```text
GEMINI_API_KEY=
TMDB_API_KEY=
```

## 5. Backend Functions

### `create_recommendation_session(preferences, batch_size=10)`

File:

`backend/services/recommendation_service.py`

Purpose:

Creates a new backend recommendation session and returns the first batch of movies.

Flow:

1. Normalize `batch_size`.
2. Convert preferences into a RAG query with `_preferences_to_query()`.
3. Search ChromaDB:

```py
original_candidates = search_movies(query, limit=50)
```

4. Apply hard filters:

```py
filtered_candidates = filter_movies(preferences, original_candidates)
```

5. Remove duplicate candidate movies.
6. Add AI/fallback explanations:

```py
candidates = add_ai_explanations(preferences, append_unique_movies([], filtered_candidates))
```

7. Slice the first batch.
8. Create a `session_id`.
9. Store session data in memory.
10. Return JSON with `session_id`, `movies`, and `has_more`.

Example response:

```json
{
  "session_id": "a11b38e6-b0b5-4362-9ac5-fb601d754daa",
  "movies": [
    {
      "id": "48",
      "title": "Nightcrawler",
      "year": 2014,
      "genres": "Thriller, Crime, Drama",
      "duration": 117,
      "rating": 7.8,
      "poster_url": "https://image.tmdb.org/t/p/w500/...",
      "document": "Title: Nightcrawler...",
      "distance": 1.14,
      "match_reason": "Nightcrawler is a stronger match because..."
    }
  ],
  "has_more": true
}
```

### `get_more_movies(session_id, batch_size=10)`

Purpose:

Returns the next batch of movies for an existing session.

Flow:

1. Find the session by `session_id`.
2. Read `session["current_index"]`.
3. Walk through `session["candidates"]`.
4. Skip already-seen movie IDs.
5. Add unseen movies to `next_batch`.
6. Update `current_index`.
7. Return next batch and `has_more`.

If the session is missing:

```json
{
  "error": "Session not found"
}
```

### `_preferences_to_query(preferences)`

Purpose:

Converts raw user preferences into a positive-only query for vector search.

Example input:

```json
{
  "userA": {
    "vibe": "Dark & intense",
    "action": "Balanced",
    "dealbreaker": "No horror"
  },
  "userB": {
    "vibe": "Warm & feel-good",
    "action": "Slow burn",
    "dealbreaker": "No extreme violence"
  }
}
```

Good query:

```text
Dark & intense Balanced Warm & feel-good Slow burn
```

Bad query:

```text
Dark & intense No horror No extreme violence
```

Why bad?

Because embedding search may match the words `horror` or `violence`, even though they are negative preferences.

Design:

```text
positive preferences -> RAG query
negative preferences -> filter logic
```

### `filter_movies(preferences, candidates)`

Purpose:

Removes movies that violate hard constraints.

Currently filters by:

- Avoided genres/dealbreakers.
- Maximum duration if a duration rule exists.

Important:

It preserves full movie objects by doing:

```py
filtered.append(movie)
```

That means `poster_url` is not lost.

### `append_unique_movies(current_movies, incoming_movies)`

Purpose:

Combines movie lists without duplicates.

Used for:

- Candidate cleanup.
- Watchlist duplicate prevention.

### `get_movie_key(movie)`

Purpose:

Creates a stable identity string for a movie.

Priority:

```text
id -> movie_id -> title
```

### `add_movie_to_watchlist(session_id, movie)`

Purpose:

Adds a liked movie to the session watchlist.

It uses `append_unique_movies()` to prevent duplicates.

### `remove_movie_from_watchlist(session_id, movie_id)`

Purpose:

Removes one movie from the session watchlist by comparing movie keys.

### `get_watchlist(session_id)`

Purpose:

Returns the watchlist for an existing session.

### `_collect_avoided_genres(preferences)`

Purpose:

Extracts negative genre/dealbreaker values from preferences.

Example:

```text
No horror -> horror
No heavy romance -> heavy romance
```

### `_get_max_duration(preferences)`

Purpose:

Looks for text like:

```text
under 2 hours
less than 120 minutes
```

and converts it into minutes.

### `_extract_movie_duration_minutes(movie)`

Purpose:

Converts a movie runtime into a number of minutes.

Supports values such as:

```text
117
117 minutes
1h 57m
2 hours
```

### `search_movies(query, limit=10)`

File:

`backend/services/rag_service.py`

Purpose:

Searches the ChromaDB movie collection by semantic similarity.

It returns movie dictionaries with metadata and distance.

### `add_ai_explanations(preferences, movies)`

File:

`backend/services/ai_service.py`

Purpose:

Adds a `match_reason` field to every movie.

If `GEMINI_API_KEY` is available, it tries to call Gemini. If not, or if the call fails, it uses a fallback explanation.

### `build_movie_document(movie)`

File:

`backend/scripts/ingest_movies.py`

Purpose:

Converts a movie into searchable text for embeddings.

### `fetch_poster_url(api_key, title, year)`

File:

`backend/scripts/fetch_posters.py`

Purpose:

Searches TMDB for a movie poster and returns a full TMDB image URL.

Example output:

```text
https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg
```

## 6. API Endpoints

### `GET /health`

Requested documentation item.

Current status:

This endpoint does not currently exist in `backend/main.py`.

A future implementation could return:

```json
{
  "status": "ok"
}
```

### `POST /recommend/session`

Purpose:

Starts a new recommendation session.

Request body:

```json
{
  "preferences": {
    "userA": {
      "vibe": "Dark & intense",
      "brainpower": "A little - keep me engaged",
      "reality": "Either works for me",
      "action": "Balanced",
      "dealbreaker": "No horror"
    },
    "userB": {
      "vibe": "Warm & feel-good",
      "brainpower": "Zero - just vibes",
      "reality": "Real world drama",
      "action": "Slow burn",
      "dealbreaker": "No extreme violence"
    }
  },
  "batch_size": 10
}
```

Response body:

```json
{
  "session_id": "...",
  "movies": [
    {
      "id": "48",
      "title": "Nightcrawler",
      "year": 2014,
      "genres": "Thriller, Crime, Drama",
      "duration": 117,
      "rating": 7.8,
      "poster_url": "https://image.tmdb.org/t/p/w500/...",
      "document": "Title: Nightcrawler...",
      "distance": 1.14,
      "match_reason": "Nightcrawler is a stronger match because..."
    }
  ],
  "has_more": true
}
```

Internal flow:

```text
/recommend/session
-> create_recommendation_session()
-> _preferences_to_query()
-> search_movies()
-> filter_movies()
-> add_ai_explanations()
-> save session
-> return first batch
```

### `POST /recommend/more`

Purpose:

Returns the next batch of movies for an existing session.

Request body:

```json
{
  "session_id": "...",
  "batch_size": 10
}
```

Response body:

```json
{
  "session_id": "...",
  "movies": [],
  "has_more": true
}
```

Internal flow:

```text
/recommend/more
-> get_more_movies()
-> find session
-> read current_index
-> skip seen movie IDs
-> return next batch
```

### `POST /watchlist/add`

Purpose:

Adds a movie to the session watchlist.

Request body:

```json
{
  "session_id": "...",
  "movie": {
    "id": "48",
    "title": "Nightcrawler"
  }
}
```

Response body:

```json
{
  "session_id": "...",
  "watchlist": []
}
```

### `POST /watchlist/remove`

Purpose:

Removes a movie from the session watchlist.

Request body:

```json
{
  "session_id": "...",
  "movie_id": "48"
}
```

Response body:

```json
{
  "session_id": "...",
  "watchlist": []
}
```

### `GET /watchlist/{session_id}`

Purpose:

Returns the current watchlist for a session.

Response body:

```json
{
  "session_id": "...",
  "watchlist": []
}
```

### `POST /api/match`

Purpose:

This endpoint still exists for backward compatibility with older frontend/backend behavior.

It receives:

```json
{
  "user_a": {
    "vibe": "...",
    "brainpower": "...",
    "reality": "...",
    "action": "...",
    "dealbreaker": "..."
  },
  "user_b": {
    "vibe": "...",
    "brainpower": "...",
    "reality": "...",
    "action": "...",
    "dealbreaker": "..."
  }
}
```

It internally calls `create_recommendation_session()` with `batch_size=5`, then maps results to an older response shape using fields like `ai_explanation`.

## 7. Frontend Files and Responsibilities

### `frontend/src/App.jsx`

Purpose:

Top-level React app and routing.

Important state:

```js
sessionId
watchlistCount
```

Important functions:

- `handleSessionChange(nextSessionId)`
- `handleWatchlistChange(movies)`

It stores the active session ID in `sessionStorage` using:

```js
film_adviser_session_id
```

Props passed:

- To `Navbar`: `likedCount`
- To `Home`: `onSessionChange`, `onWatchlistChange`
- To `Watchlist`: `sessionId`, `onWatchlistChange`

### `frontend/src/api/recommendations.js`

Purpose:

Raw backend API calls.

It should not contain recommendation logic, filtering, RAG logic, or duplicate logic.

Exports:

- `createRecommendationSession()`
- `getMoreMovies()`
- `addToWatchlist()`
- `removeFromWatchlist()`
- `getWatchlist()`

### `frontend/src/pages/Home.jsx`

Purpose:

Main matching page. It owns quiz page state and calls backend APIs.

Important state:

```js
prefA
prefB
quizResetId
isAnalyzing
isLoadingMore
error
sessionId
hasMore
movies
```

Important functions:

- `handleLoadMore()`
- `handleLike(movie)`
- `handleDislike()`
- `handleReset()`

Backend connections:

- Calls `createRecommendationSession()` after both users complete the quiz.
- Calls `getMoreMovies()` when the swiper asks for more.
- Calls `addToWatchlist()` when a movie is liked.

### `frontend/src/pages/Watchlist.jsx`

Purpose:

Displays the backend session watchlist.

Important state:

```js
movies
error
```

Important functions:

- `handleRemove(movie)`
- `handleClear()`
- `getPrimaryGenre(movie)`

Backend connections:

- Calls `getWatchlist(sessionId)`.
- Calls `removeFromWatchlist(sessionId, movieId)`.

### `frontend/src/pages/Landing.jsx`

Purpose:

Landing page that introduces Film Adviser and links users to the match page.

It does not call the backend.

### `frontend/src/pages/About.jsx`

Purpose:

Static informational page explaining the project concept and features.

It does not call the backend.

### `frontend/src/components/PreferenceCard.jsx`

Purpose:

Renders one user's preference quiz.

Props:

- `user`
- `isActive`
- `isDone`
- `onComplete`

Important state:

```js
step
answers
```

Important function:

```js
handleSelect(value)
```

It builds a profile like:

```js
{
  vibe: "...",
  brainpower: "...",
  reality: "...",
  action: "...",
  dealbreaker: "..."
}
```

### `frontend/src/components/MovieSwiper.jsx`

Purpose:

Displays movie cards and handles swipe interactions.

Props:

- `isReady`
- `isAnalyzing`
- `isLoadingMore`
- `movies`
- `canLoadMore`
- `error`
- `onLike`
- `onDislike`
- `onNearEnd`
- `onReset`

Important state:

```js
currentIndex
showMatch
matchedMovie
likedCount
```

Important behavior:

- Right swipe likes a movie.
- Left swipe dislikes a movie.
- ArrowRight likes.
- ArrowLeft dislikes.
- When remaining cards are low, it calls `onNearEnd()`.

### `frontend/src/components/MovieCard.jsx`

Purpose:

Displays a single movie card.

It renders:

- `poster_url`
- `title`
- `year`
- `genres`
- `duration`
- `rating`
- `match_reason`

Poster fallback:

```js
src={movie.poster_url || PLACEHOLDER_POSTER_URL}
onError={(e) => {
  if (e.currentTarget.src !== PLACEHOLDER_POSTER_URL) {
    e.currentTarget.src = PLACEHOLDER_POSTER_URL;
  }
}}
```

### `frontend/src/App.css`

Purpose:

Main visual styling for the React app.

It controls:

- Dark cinema theme.
- Navbar.
- Landing page.
- Match page layout.
- Preference cards.
- Movie swiper cards.
- Watchlist grid.
- Buttons.
- Responsive layout.

## 8. Frontend Functions

### `createRecommendationSession(preferences, batchSize)`

File:

`src/api/recommendations.js`

Calls:

```text
POST /recommend/session
```

Sends:

```json
{
  "preferences": {},
  "batch_size": 10
}
```

### `getMoreMovies(sessionId, batchSize)`

Calls:

```text
POST /recommend/more
```

Sends:

```json
{
  "session_id": "...",
  "batch_size": 10
}
```

### `addToWatchlist(sessionId, movie)`

Calls:

```text
POST /watchlist/add
```

### `removeFromWatchlist(sessionId, movieId)`

Calls:

```text
POST /watchlist/remove
```

### `getWatchlist(sessionId)`

Calls:

```text
GET /watchlist/{session_id}
```

### Home quiz completion flow

1. User A completes `PreferenceCard`.
2. `setPrefA()` stores User A answers.
3. User B becomes active.
4. User B completes `PreferenceCard`.
5. `setPrefB()` stores User B answers.
6. A React effect sees both `prefA` and `prefB`.
7. It calls `createRecommendationSession()`.

### Home backend call flow

`Home.jsx` sends:

```js
createRecommendationSession({ userA: prefA, userB: prefB }, BATCH_SIZE)
```

Then stores:

```js
sessionId
movies
hasMore
```

### `handleLoadMore()`

Purpose:

Calls the backend for the next batch when the swiper asks for more.

### `handleLike(movie)`

Purpose:

Sends liked movie to the backend watchlist:

```js
addToWatchlist(sessionId, movie)
```

Then updates the navbar count from returned watchlist length.

### Reset flow

`handleReset()` clears:

- User A preferences.
- User B preferences.
- Movies.
- Error.
- Session ID.
- Loading state.
- Watchlist count.
- Quiz reset key.

### MovieSwiper swipe logic

`handleAction(action)` does:

- If `like`, call `onLike(currentMovie)`.
- If `dislike`, call `onDislike(currentMovie)`.
- Move to the next card.

### Near-end loading trigger

MovieSwiper calculates:

```js
const remainingCards = movies.length - currentIndex;
```

If `remainingCards <= 2`, it calls:

```js
onNearEnd()
```

### Keyboard controls

MovieSwiper listens for:

- `ArrowRight` -> like
- `ArrowLeft` -> dislike

### MovieCard poster rendering

MovieCard displays:

```js
movie.poster_url
```

If missing or broken, it uses:

```text
http://127.0.0.1:8000/static/placeholder-poster.svg
```

### MovieCard match reason display

MovieCard uses:

```js
const reason = movie.match_reason ?? movie.ai_explanation;
```

`match_reason` is the current backend field. `ai_explanation` supports older compatibility responses.

### Watchlist loading

When `sessionId` exists, Watchlist calls:

```js
getWatchlist(sessionId)
```

### Watchlist removing

For one movie:

```js
removeFromWatchlist(sessionId, movie.id ?? movie.movie_id ?? movie.title)
```

### Watchlist clearing

Currently, clear loops over visible movies and removes each one through `removeFromWatchlist()`.

There is no dedicated backend clear endpoint yet.

## 9. RAG Pipeline Explanation

The RAG pipeline starts with raw movie data:

```text
backend/data/movies.json
```

Each movie contains structured fields like:

- title
- year
- genres
- description
- duration
- rating
- poster_url

`scripts/ingest_movies.py` converts each movie into a searchable text document. For example:

```text
Title: Nightcrawler. Year: 2014. Genres: Thriller, Crime, Drama. Description: ... Duration: 117 minutes. Rating: 7.8.
```

ChromaDB stores:

- The text document.
- The embedding for semantic search.
- Metadata like `title`, `year`, `genres`, `duration`, `rating`, and `poster_url`.

When a user starts a recommendation session:

1. `recommendation_service.py` creates a positive-only query.
2. `rag_service.py` searches ChromaDB by semantic similarity.
3. `filter_movies()` removes movies violating hard constraints.
4. `ai_service.py` adds `match_reason`.
5. The backend returns final movie objects to the frontend.

Important distinction:

```text
Vector search finds semantically similar movies.
Hard filters enforce dealbreakers and constraints.
```

## 10. Poster Image Pipeline

Poster data starts in:

```text
backend/data/movies.json
```

To fetch real posters:

1. `scripts/fetch_posters.py` reads `TMDB_API_KEY`.
2. It searches TMDB by movie title and year.
3. It reads `poster_path` from the best result.
4. It stores:

```text
https://image.tmdb.org/t/p/w500{poster_path}
```

in `movie["poster_url"]`.

If no poster is found, it uses:

```text
http://127.0.0.1:8000/static/placeholder-poster.svg
```

Then:

1. `scripts/ingest_movies.py` stores `poster_url` into ChromaDB metadata.
2. `rag_service.py` returns `poster_url` from Chroma metadata.
3. `recommendation_service.py` preserves the full movie object.
4. `ai_service.py` copies the full movie object and adds `match_reason`.
5. `MovieCard.jsx` displays `movie.poster_url`.
6. If the image fails, `onError` switches to the static placeholder.

Why rebuild ChromaDB after poster changes?

Because ChromaDB stores its own copy of movie metadata. Updating `movies.json` alone does not update Chroma metadata. You must run ingestion again.

## 11. Environment Variables

### `.env`

Expected local values:

```text
GEMINI_API_KEY=your_real_gemini_key
TMDB_API_KEY=your_real_tmdb_key
```

`GEMINI_API_KEY` is used by `services/ai_service.py` for AI explanations.

`TMDB_API_KEY` is used by `scripts/fetch_posters.py` for poster fetching.

### `.env.example`

Should contain placeholders only:

```text
GEMINI_API_KEY=
TMDB_API_KEY=
```

Never commit real API keys.

## 12. Commands

### Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Run poster fetch

PowerShell:

```powershell
cd backend
$env:TMDB_API_KEY="your_tmdb_api_key"
python scripts/fetch_posters.py
```

### Delete ChromaDB on PowerShell

```powershell
cd backend
Remove-Item -Recurse -Force .\vector_db\chroma
```

### Rebuild vector DB

```bash
cd backend
python scripts/ingest_movies.py
```

### Run backend

```bash
cd backend
uvicorn main:app --reload
```

### Run frontend

```bash
cd frontend
npm install
npm run dev
```

### Test backend

Open:

```text
http://127.0.0.1:8000/docs
```

## 13. Data Flow Diagram In Text

```text
User quiz
-> React Home.jsx
-> recommendations.js
-> FastAPI /recommend/session
-> recommendation_service.py
-> rag_service.py
-> ChromaDB
-> filter_movies()
-> ai_service.py
-> response movies
-> MovieSwiper.jsx
-> MovieCard.jsx
```

Watchlist flow:

```text
Movie like
-> MovieSwiper.jsx
-> Home.jsx handleLike()
-> recommendations.js addToWatchlist()
-> FastAPI /watchlist/add
-> recommendation_service.py
-> session["watchlist"]
-> Watchlist.jsx
```

Poster flow:

```text
fetch_posters.py
-> movies.json poster_url
-> ingest_movies.py
-> ChromaDB metadata
-> rag_service.py
-> backend movie response
-> MovieCard.jsx img src
```

## 14. Current Limitations

- Sessions are stored in memory.
- Watchlists disappear after backend restart.
- There are no real user accounts yet.
- There is no persistent database for sessions/watchlists yet.
- Poster fetching requires `TMDB_API_KEY`.
- AI explanations require `GEMINI_API_KEY`; otherwise fallback explanations are used.
- ChromaDB must be rebuilt after `movies.json` changes.
- `GET /health` does not currently exist.
- Watchlist clear is implemented in the frontend by removing movies one by one; there is no dedicated backend clear endpoint yet.
- `.env.example` currently appears to be empty and should be filled with placeholder variable names.

## 15. Future Improvements

- Add a persistent database for sessions and watchlists.
- Add authentication.
- Save watchlists per user or per couple.
- Add better couple preference balancing.
- Add dislike feedback learning.
- Add a dedicated `/watchlist/clear` endpoint.
- Add `GET /health`.
- Add deployment configuration.
- Add production environment variable documentation.
- Add backend tests for recommendation sessions, pagination, watchlists, poster metadata, and filtering.
- Add frontend tests for quiz flow, swiper behavior, and watchlist display.
