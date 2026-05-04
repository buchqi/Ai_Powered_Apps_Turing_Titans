from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Turing Titans - Film Adviser API")

# This matches the Frontend's new question pack perfectly
class UserPreferences(BaseModel):
    vibe: str
    brainpower: str
    reality: str
    action: str
    dealbreaker: str

class MatchRequest(BaseModel):
    user_a: UserPreferences
    user_b: UserPreferences

class MovieRecommendation(BaseModel):
    title: str
    year: str
    poster_url: str
    genres: List[str]
    ai_fairness_score: int
    ai_explanation: str

@app.post("/api/match", response_model=List[MovieRecommendation])
async def generate_matches(payload: MatchRequest):
    """
    TEAMMATES: Implement TMDb API fetching here!
    1. Parse payload.user_a and payload.user_b
    2. Map "Laugh & Relax" -> TMDb Genre ID 35 (Comedy)
    3. If dealbreaker == "No Sad Endings", filter out Drama/Tragedy tags.
    4. Pass through an LLM to generate the `ai_explanation`.
    """
    
    # Mock Response so Frontend can keep working
    return [
        {
            "title": "Everything Everywhere All at Once",
            "year": "2022",
            "poster_url": "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070",
            "genres": ["Action", "Sci-Fi", "Comedy"],
            "ai_fairness_score": 96,
            "ai_explanation": "Hits User A's 'Mind-Bending' requirement while giving User B the 'Laugh & Relax' vibe."
        }
    ]