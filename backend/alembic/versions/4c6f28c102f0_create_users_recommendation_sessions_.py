"""create users recommendation sessions and watchlist items

Revision ID: 4c6f28c102f0
Revises: 
Create Date: 2026-06-08 18:47:20.456815

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4c6f28c102f0'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "recommendation_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("guest_session_id", sa.String(), nullable=True),
        sa.Column("answers_json", sa.JSON(), nullable=False),
        sa.Column("recommended_movies_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_recommendation_sessions_guest_session_id",
        "recommendation_sessions",
        ["guest_session_id"],
    )

    op.create_table(
        "watchlist_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("guest_session_id", sa.String(), nullable=True),
        sa.Column("movie_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("poster_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_watchlist_items_guest_session_id", "watchlist_items", ["guest_session_id"])
    op.create_index("ix_watchlist_items_movie_id", "watchlist_items", ["movie_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_watchlist_items_movie_id", table_name="watchlist_items")
    op.drop_index("ix_watchlist_items_guest_session_id", table_name="watchlist_items")
    op.drop_table("watchlist_items")

    op.drop_index(
        "ix_recommendation_sessions_guest_session_id",
        table_name="recommendation_sessions",
    )
    op.drop_table("recommendation_sessions")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
