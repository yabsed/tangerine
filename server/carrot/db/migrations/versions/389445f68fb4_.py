"""empty message

Revision ID: 389445f68fb4
Revises: c6a3626040c7
Create Date: 2026-01-22 20:09:23.411207

"""

import os
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql
from sqlalchemy.types import UserDefinedType

import json


# revision identifiers, used by Alembic.
revision: str = "389445f68fb4"
down_revision: Union[str, Sequence[str], None] = "c6a3626040c7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# copy of custom type
class MySQLGeometry(UserDefinedType):
    def get_col_spec(self) -> str:
        return "GEOMETRY"

    def bind_expression(self, bindvalue: sa.BindParameter) -> sa.ColumnElement | None:
        return sa.func.ST_GeomFromGeoJSON(bindvalue, 1, 4326)


def upgrade() -> None:
    # 먼저 json 파일이 있는지 확인하고, 없으면 오류 발생
    current_dir = os.path.dirname(__file__)
    json_path = os.path.join(current_dir, "../../../data/full_region_data.json")

    if not os.path.exists(json_path):
        raise FileNotFoundError(f"\n[ERROR] 필수 데이터 파일이 없습니다: {json_path}\n")

    """Upgrade schema."""
    op.add_column(
        "region",
        sa.Column(
            "geom", MySQLGeometry(), nullable=True
        ),  # 데이터 추가 후 non-nullable로 변경
    )

    # read from json file
    with open(json_path, "r") as file:
        data = json.load(file)

    params = []
    for feature in data["features"]:
        geom = json.dumps(feature["geometry"])

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

        params.append({"sido": sido, "sigugun": sigugun, "dong": dong, "geom": geom})

    stmt = sa.text(
        """
        UPDATE region 
        SET geom = ST_GeomFromGeoJSON(:geom, 1, 4326) 
        WHERE sido = :sido
        AND sigugun = :sigugun
        AND dong = :dong
        """
    )
    connection = op.get_bind()
    connection.execute(stmt, params)

    op.alter_column("region", "geom", nullable=False, existing_type=MySQLGeometry)
    op.create_index(
        op.f("idx_region_geom"),
        "region",
        ["geom"],
        unique=False,
        mysql_prefix="SPATIAL",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("idx_region_geom"), table_name="region")
    op.drop_column("region", "geom")
