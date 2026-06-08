"""add username to users

Revision ID: 8f3d2a9c1b7e
Revises: 4c6f28c102f0
Create Date: 2026-06-08 19:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8f3d2a9c1b7e"
down_revision: Union[str, Sequence[str], None] = "4c6f28c102f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("username", sa.String(), nullable=True))
    op.execute("UPDATE users SET username = 'user_' || id WHERE username IS NULL")
    op.alter_column("users", "username", nullable=False)
    op.create_index("ix_users_username", "users", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_username", table_name="users")
    op.drop_column("users", "username")
