from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from api.auth import router as auth_router
from api.user_recommendations import router as user_recommendations_router
from api.user_watchlist import router as user_watchlist_router
from services.recommendation_service import (
    add_movie_to_watchlist,
    create_recommendation_session,
    get_more_movies,
    get_watchlist,
    remove_movie_from_watchlist,
)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.include_router(auth_router)
app.include_router(user_recommendations_router)
app.include_router(user_watchlist_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

class UserPreferences(BaseModel):
    vibe: str
    brainpower: str
    reality: str
    action: str
    dealbreaker: str

class MatchRequest(BaseModel):
    user_a: UserPreferences
    user_b: UserPreferences

class RecommendationSessionRequest(BaseModel):
    preferences: dict
    batch_size: int = 10

class MoreRecommendationsRequest(BaseModel):
    session_id: str
    batch_size: int = 10

class WatchlistAddRequest(BaseModel):
    session_id: str
    movie: dict

class WatchlistRemoveRequest(BaseModel):
    session_id: str
    movie_id: str

@app.post("/recommend/session")
async def generate_recommendation_session(payload: RecommendationSessionRequest):
    return create_recommendation_session(payload.preferences, payload.batch_size)

@app.post("/recommend/more")
async def generate_more_recommendations(payload: MoreRecommendationsRequest):
    return get_more_movies(payload.session_id, payload.batch_size)

@app.post("/watchlist/add")
async def add_watchlist_item(payload: WatchlistAddRequest):
    return add_movie_to_watchlist(payload.session_id, payload.movie)

@app.post("/watchlist/remove")
async def remove_watchlist_item(payload: WatchlistRemoveRequest):
    return remove_movie_from_watchlist(payload.session_id, payload.movie_id)

@app.get("/watchlist/{session_id}")
async def read_watchlist(session_id: str):
    return get_watchlist(session_id)

@app.post("/api/match")
async def generate_matches(payload: MatchRequest):
    prefs = {"userA": payload.user_a.dict(), "userB": payload.user_b.dict()}
    result = create_recommendation_session(prefs, batch_size=5)

    return [{
        "title": m.get("title"),
        "year": str(m.get("year")),
        "poster_url": m.get("poster_url"),
        "genres": m.get("genres"),
        "ai_fairness_score": 95,
        "ai_explanation": m.get("match_reason")
    } for m in result["movies"]]
