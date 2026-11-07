"""empty message

Revision ID: 7fa611714908
Revises: 4acbbaffde7f
Create Date: 2026-01-29 04:07:46.855801

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = '7fa611714908'
down_revision: Union[str, Sequence[str], None] = '4acbbaffde7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. 유니크 인덱스 생성 (이름을 다르게)
    op.create_index('ix_auction_product_id_unique', 'auction', ['product_id'], unique=True)
    
    # 2. 기존 일반 인덱스 삭제
    op.drop_index('ix_auction_product_id', table_name='auction')

    # 🚀 추가: 이름을 다시 원래대로 돌려놓기 (RENAME)
    # MySQL 5.7+ 환경이라면 이렇게 하면 Alembic이 더 이상 새 파일을 안 만듭니다.
    op.execute("ALTER TABLE auction RENAME INDEX ix_auction_product_id_unique TO ix_auction_product_id")

    op.drop_column('auction', 'starting_price')

def downgrade() -> None:
    op.add_column('auction', sa.Column('starting_price', sa.Integer(), nullable=False))
    
    # 🚀 추가: 이름을 다시 유니크용으로 바꿨다가
    op.execute("ALTER TABLE auction RENAME INDEX ix_auction_product_id TO ix_auction_product_id_unique")
    
    # 일반 인덱스 복구 후 유니크 삭제
    op.create_index('ix_auction_product_id', 'auction', ['product_id'], unique=False)
    op.drop_index('ix_auction_product_id_unique', table_name='auction')