from typing import Any
import uuid
from sqlalchemy import (
    BindParameter,
    Column,
    Index,
    String,
    Integer,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql.elements import ColumnElement
from sqlalchemy.types import UserDefinedType
from carrot.db.common import Base


class MySQLGeometry(UserDefinedType):
    cache_ok = True

    def get_col_spec(self) -> str:
        return "GEOMETRY"

    def bind_expression(self, bindvalue: BindParameter) -> ColumnElement | None:
        return func.ST_GeomFromGeoJSON(bindvalue, 1, 4326)


class Region(Base):
    __tablename__ = "region"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )
    sido: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    sigugun: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    dong: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    full_name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)

    geom: Mapped[str] = mapped_column(MySQLGeometry, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "sido", "sigugun", "dong", name="uix_region_sido_sigugun_dong"
        ),
        Index("idx_region_geom", "geom", mysql_prefix="SPATIAL"),
    )

    @property
    def name(self):
        return f"{self.sido} {self.sigugun} {self.dong}"
