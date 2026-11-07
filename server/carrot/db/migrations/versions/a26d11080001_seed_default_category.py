"""Seed the category used by the product creation form.

Revision ID: a26d11080001
Revises: 7fa611714908
"""
from alembic import op

revision = "a26d11080001"
down_revision = "7fa611714908"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("INSERT IGNORE INTO category (id, name) VALUES ('1', '기타')")


def downgrade():
    # Products may reference this lookup row; keep it during an app rollback.
    pass
