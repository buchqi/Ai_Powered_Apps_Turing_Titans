from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from db.base import Base


class RecommendationSession(Base):
    __tablename__ = "recommendation_sessions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    guest_session_id = Column(String, nullable=True, index=True)

    answers_json = Column(JSON, nullable=False)
    recommended_movies_json = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship(
        "User",
        back_populates="recommendation_sessions",
    )