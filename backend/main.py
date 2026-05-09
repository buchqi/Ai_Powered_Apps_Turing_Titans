from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from services.recommendation_service import create_recommendation_session

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserPreferences(BaseModel):
    vibe: str
    brainpower: str
    reality: str
    action: str
    dealbreaker: str

class MatchRequest(BaseModel):
    user_a: UserPreferences
    user_b: UserPreferences

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