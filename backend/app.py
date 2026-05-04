from fastapi import FastAPI
from pydantic import BaseModel

from services.recommendation_service import (
    create_recommendation_session,
    get_more_movies,
)


app = FastAPI()


class RecommendationRequest(BaseModel):
    preferences: dict
    batch_size: int = 10


class MoreMoviesRequest(BaseModel):
    session_id: str
    batch_size: int = 10


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/recommend/session")
def recommend_session(request: RecommendationRequest) -> dict:
    return create_recommendation_session(request.preferences, request.batch_size)


@app.post("/recommend/more")
def recommend_more(request: MoreMoviesRequest) -> dict:
    return get_more_movies(request.session_id, request.batch_size)
