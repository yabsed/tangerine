from typing import Annotated

from fastapi import Depends
from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from carrot.app.region.models import Region
from carrot.db.connection import get_db_session


class RegionRepository:
    def __init__(
        self, session: Annotated[AsyncSession, Depends(get_db_session)]
    ) -> None:
        self.session = session

    async def create_region(self, name: str) -> Region:
        region = Region(name=name)
        self.session.add(region)
        await self.session.flush()
        return region

    async def get_region_by_id(self, id: str) -> Region | None:
        return await self.session.scalar(select(Region).where(Region.id == id))

    async def get_all_sido(self) -> list[str]:
        result = await self.session.scalars(
            select(Region.sido).distinct().order_by(Region.sido)
        )
        return list(result.all())

    async def get_all_sigugun(self, sido: str) -> list[str]:
        result = await self.session.scalars(
            select(Region.sigugun)
            .where(Region.sido == sido)
            .distinct()
            .order_by(Region.sigugun)
        )
        return list(result.all())

    async def get_all_dong(self, sido: str, sigugun: str) -> list[dict[str, str]]:
        result = await self.session.execute(
            select(Region.id, Region.dong)
            .where(and_(Region.sido == sido, Region.sigugun == sigugun))
            .distinct()
            .order_by(Region.dong)
        )

        return [dict(row) for row in result.mappings()]

    async def get_region_from_coordinates(
        self, lat: float, long: float
    ) -> Region | None:
        point_wkt = f"POINT({lat} {long})"
        return await self.session.scalar(
            select(Region).where(
                func.ST_Contains(Region.geom, func.ST_GeomFromText(point_wkt, 4326))
            )
        )

    async def get_regions_from_query(
        self, query: str | None, limit: int, offset: int
    ) -> list[Region]:
        stmt = (
            select(Region)
            .where(Region.full_name.contains(query))
            .order_by(Region.sido, Region.sigugun, Region.dong)
            .limit(limit)
            .offset(offset)
        )

        regions = await self.session.scalars(stmt)
        return list(regions.all())
