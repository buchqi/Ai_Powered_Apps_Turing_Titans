from datetime import datetime

from pydantic import BaseModel, ConfigDict


class WatchlistAddRequest(BaseModel):
    movie_id: str
    title: str
    poster_url: str | None = None


class WatchlistRemoveRequest(BaseModel):
    movie_id: str


class WatchlistItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    movie_id: str
    title: str
    poster_url: str | None = None
    created_at: datetime


class WatchlistResponse(BaseModel):
    items: list[WatchlistItemResponse]


class WatchlistRemoveResponse(BaseModel):
    message: str
