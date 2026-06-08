from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import User
from services.auth_service import get_current_user
from services.user_recommendation_service import (
    create_user_recommendation_session,
    get_more_user_recommendations,
)


router = APIRouter(prefix="/users/recommend", tags=["user recommendations"])


class RecommendationSessionRequest(BaseModel):
    preferences: dict
    batch_size: int = 10


class MoreRecommendationsRequest(BaseModel):
    session_id: str
    batch_size: int = 10


@router.post("/session")
def generate_user_recommendation_session(
    payload: RecommendationSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_user_recommendation_session(
        db=db,
        current_user=current_user,
        preferences=payload.preferences,
        batch_size=payload.batch_size,
    )


@router.post("/more")
def generate_more_user_recommendations(
    payload: MoreRecommendationsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_more_user_recommendations(
        db=db,
        current_user=current_user,
        session_id=payload.session_id,
        batch_size=payload.batch_size,
    )
