"""Reset disposable image references before switching to the public image bucket.

Revision ID: a26d11080002
Revises: a26d11080001
"""
from alembic import op

revision = "a26d11080002"
down_revision = "a26d11080001"
branch_labels = None
depends_on = None


def upgrade():
    # Preserve external profile images and all non-image application data.
    op.execute("""
        UPDATE user SET profile_image = NULL
        WHERE profile_image IN (SELECT image_url FROM image)
           OR profile_image REGEXP '^https?://[^/]+/api/image/[0-9a-fA-F-]{36}/file$'
    """)
    op.execute("UPDATE product SET image_ids = JSON_ARRAY()")
    op.execute("DELETE FROM image")


def downgrade():
    # The explicitly discarded image references cannot be reconstructed.
    pass
