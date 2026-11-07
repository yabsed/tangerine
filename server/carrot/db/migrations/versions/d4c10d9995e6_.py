"""empty message

Revision ID: d4c10d9995e6
Revises: 389445f68fb4
Create Date: 2026-01-22 22:22:08.918131

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

import json
import os

# revision identifiers, used by Alembic.
revision: str = "d4c10d9995e6"
down_revision: Union[str, Sequence[str], None] = "389445f68fb4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 먼저 json 파일이 있는지 확인하고, 없으면 오류 발생
    current_dir = os.path.dirname(__file__)
    json_path = os.path.join(current_dir, "../../../data/full_region_data.json")
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"\n[ERROR] 필수 데이터 파일이 없습니다: {json_path}\n")

    op.add_column(
        "region",
        sa.Column("full_name", sa.String(length=100), nullable=True, unique=True),
    )

    # read from json file
    with open(json_path, "r") as file:
        data = json.load(file)

    params = []
    for feature in data["features"]:
        props = feature.get("properties", {})
        sido = props.get("sidonm", "")
        sigugun = props.get("sggnm", "")
        full_name = props.get("adm_nm", "")

        # 읍면동 추출 및 빈 문자열 처리
        parts = full_name.split()
        dong = parts[-1] if parts else ""

        # 시군구 없는 경우 처리 (세종시 등)
        if not sigugun or sigugun == "None":
            sigugun = sido if "세종" in sido else ""

        params.append(
            {"sido": sido, "sigugun": sigugun, "dong": dong, "full_name": full_name}
        )

    stmt = sa.text(
        """
        UPDATE region 
        SET full_name = :full_name
        WHERE sido = :sido
        AND sigugun = :sigugun
        AND dong = :dong
        """
    )
    connection = op.get_bind()
    connection.execute(stmt, params)

    op.alter_column(
        "region", "full_name", nullable=False, existing_type=sa.String(length=100)
    )
    op.create_index(op.f("ix_region_full_name"), "region", ["full_name"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_region_full_name"), table_name="region")
    op.drop_column("region", "full_name")
