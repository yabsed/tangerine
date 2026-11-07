"""empty message

Revision ID: c6a3626040c7
Revises: 3e2fb92c6bac
Create Date: 2026-01-19 23:48:13.692876

"""

import json
import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql
from sqlalchemy.sql import table, column

# revision identifiers, used by Alembic.
revision: str = "c6a3626040c7"
down_revision: Union[str, Sequence[str], None] = "3e2fb92c6bac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 먼저 json 파일이 있는지 확인하고, 없으면 오류 발생
    current_dir = os.path.dirname(__file__)
    json_path = os.path.join(current_dir, "../../../data/regions.json")

    if not os.path.exists(json_path):
        raise FileNotFoundError(
            f"\n[ERROR] 필수 데이터 파일이 없습니다: {json_path}\n"
            "데이터 시딩 없이 마이그레이션을 진행할 수 없습니다. "
            "먼저 데이터 생성 스크립트 (carrot/data/create_region_data.py)를 실행해 주세요."
        )

    # 기존 스키마 데이터 삭제
    op.execute("DELETE FROM region")

    op.add_column("region", sa.Column("sido", sa.String(length=20), nullable=False))
    op.add_column("region", sa.Column("sigugun", sa.String(length=20), nullable=False))
    op.add_column("region", sa.Column("dong", sa.String(length=20), nullable=False))
    op.drop_index(op.f("ix_region_name"), table_name="region")
    op.create_index(op.f("ix_region_sido"), "region", ["sido"], unique=False)
    op.create_index(op.f("ix_region_sigugun"), "region", ["sigugun"], unique=False)
    op.create_unique_constraint(
        "uix_region_sido_sigugun_dong", "region", ["sido", "sigugun", "dong"]
    )
    op.drop_column("region", "name")

    ### json 파일에서 지역 데이터 추가
    # 모델이 바뀌어도 작동하기 위해 모델 임포트 대신 임시 테이블을 정의
    region_helper = table(
        "region",
        column("id", sa.String),
        column("sido", sa.String),
        column("sigugun", sa.String),
        column("dong", sa.String),
    )

    with open(json_path, "r", encoding="utf-8") as f:
        region_data = json.load(f)
        if region_data:
            op.bulk_insert(region_helper, region_data)
            print(f"\nSuccessfully inserted {len(region_data)} regions.")


def downgrade() -> None:
    """Downgrade schema."""
    # 먼저 데이터 삭제
    op.execute("DELETE FROM region")

    op.add_column("region", sa.Column("name", mysql.VARCHAR(length=20), nullable=False))
    op.drop_constraint("uix_region_sido_sigugun_dong", "region", type_="unique")
    op.drop_index(op.f("ix_region_sigugun"), table_name="region")
    op.drop_index(op.f("ix_region_sido"), table_name="region")
    op.create_index(op.f("ix_region_name"), "region", ["name"], unique=True)
    op.drop_column("region", "dong")
    op.drop_column("region", "sigugun")
    op.drop_column("region", "sido")
