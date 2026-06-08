from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.recommendation_session import RecommendationSession
from models.user import User
from services.recommendation_service import (
    append_unique_movies,
    create_recommendation_session,
    get_more_movies,
)


def create_user_recommendation_session(
    db: Session,
    current_user: User,
    preferences: dict,
    batch_size: int = 10,
) -> dict:
    result = create_recommendation_session(preferences, batch_size)

    recommendation_session = RecommendationSession(
        user_id=current_user.id,
        guest_session_id=result["session_id"],
        answers_json=preferences,
        recommended_movies_json=result.get("movies", []),
    )
    db.add(recommendation_session)
    db.commit()

    return result


def get_more_user_recommendations(
    db: Session,
    current_user: User,
    session_id: str,
    batch_size: int = 10,
) -> dict:
    recommendation_session = (
        db.query(RecommendationSession)
        .filter(
            RecommendationSession.guest_session_id == session_id,
            RecommendationSession.user_id == current_user.id,
        )
        .first()
    )

    if recommendation_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recommendation session not found.",
        )

    result = get_more_movies(session_id, batch_size)
    if "error" in result:
        return result

    existing_movies = recommendation_session.recommended_movies_json or []
    recommendation_session.recommended_movies_json = append_unique_movies(
        existing_movies,
        result.get("movies", []),
    )
    db.commit()

    return result
