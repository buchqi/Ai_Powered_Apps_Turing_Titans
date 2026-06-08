from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.user import User
from models.watchlist import WatchlistItem
from schemas.watchlist import WatchlistAddRequest, WatchlistRemoveRequest


def get_user_watchlist(db: Session, current_user: User) -> dict:
    items = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == current_user.id)
        .order_by(WatchlistItem.created_at.desc())
        .all()
    )

    return {"items": items}


def add_user_watchlist_item(
    db: Session,
    current_user: User,
    payload: WatchlistAddRequest,
) -> WatchlistItem:
    existing_item = (
        db.query(WatchlistItem)
        .filter(
            WatchlistItem.user_id == current_user.id,
            WatchlistItem.movie_id == payload.movie_id,
        )
        .first()
    )

    if existing_item is not None:
        return existing_item

    item = WatchlistItem(
        user_id=current_user.id,
        guest_session_id=None,
        movie_id=payload.movie_id,
        title=payload.title,
        poster_url=payload.poster_url,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return item


def remove_user_watchlist_item(
    db: Session,
    current_user: User,
    payload: WatchlistRemoveRequest,
) -> dict:
    item = (
        db.query(WatchlistItem)
        .filter(
            WatchlistItem.user_id == current_user.id,
            WatchlistItem.movie_id == payload.movie_id,
        )
        .first()
    )

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Watchlist item not found.",
        )

    db.delete(item)
    db.commit()

    return {"message": "Watchlist item removed"}
