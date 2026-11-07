"""merge team branches

Revision ID: 37888c5630b7
Revises: 7fdb040a28ac, a4baad1fee6c
Create Date: 2026-01-28 01:19:16.932211

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '37888c5630b7'
down_revision: Union[str, Sequence[str], None] = ('7fdb040a28ac', 'a4baad1fee6c')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
