"""merge multiple heads

Revision ID: cdfdeca872a6
Revises: 24a7ee2d83df, 88d754858e1d
Create Date: 2026-01-26 14:35:54.455124

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cdfdeca872a6'
down_revision: Union[str, Sequence[str], None] = ('24a7ee2d83df', '88d754858e1d')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
