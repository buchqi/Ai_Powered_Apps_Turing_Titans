from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from models.user import User
from schemas.watchlist import (
    WatchlistAddRequest,
    WatchlistItemResponse,
    WatchlistRemoveRequest,
    WatchlistRemoveResponse,
    WatchlistResponse,
)
from services.auth_service import get_current_user
from services.user_watchlist_service import (
    add_user_watchlist_item,
    get_user_watchlist,
    remove_user_watchlist_item,
)


router = APIRouter(prefix="/users/watchlist", tags=["user watchlist"])


@router.get("", response_model=WatchlistResponse)
def read_user_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_user_watchlist(db, current_user)


@router.post("/add", response_model=WatchlistItemResponse)
def add_to_user_watchlist(
    payload: WatchlistAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return add_user_watchlist_item(db, current_user, payload)


@router.post("/remove", response_model=WatchlistRemoveResponse)
def remove_from_user_watchlist(
    payload: WatchlistRemoveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return remove_user_watchlist_item(db, current_user, payload)
