from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from carrot.app.region.schemas import RegionResponse
from carrot.app.region.services import RegionService

region_router = APIRouter()


@region_router.get("/search")
async def search_region(
    region_service: Annotated[RegionService, Depends()],
    query: str = Query(default=""),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[RegionResponse]:
    result = await region_service.get_region_from_query(query, limit, offset)
    return [RegionResponse.model_validate(elem) for elem in result]


@region_router.get("/nearby")
async def nearby_region(
    region_service: Annotated[RegionService, Depends()],
    lat: float = Query(),
    long: float = Query(),
) -> RegionResponse:
    region = await region_service.get_region_from_coordinates(lat, long)
    if not region:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Latitude and Longitude not in Korea",
        )
    return RegionResponse.model_validate(region)


@region_router.get("/sido", status_code=status.HTTP_200_OK)
async def get_all_sido(
    region_service: Annotated[RegionService, Depends()],
) -> list[str]:
    return await region_service.get_all_sido()


@region_router.get("/sido/{sido_nm}/sigugun", status_code=status.HTTP_200_OK)
async def get_all_sigugun(
    sido_nm: str,
    region_service: Annotated[RegionService, Depends()],
) -> list[str]:
    return await region_service.get_all_sigugun(sido_nm=sido_nm)


@region_router.get(
    "/sido/{sido_nm}/sigugun/{sigugun_nm}/dong", status_code=status.HTTP_200_OK
)
async def get_all_dong(
    sido_nm: str,
    sigugun_nm: str,
    region_service: Annotated[RegionService, Depends()],
) -> list[dict]:
    return await region_service.get_all_dong(sido_nm=sido_nm, sigugun_nm=sigugun_nm)


@region_router.get("/{region_id}", status_code=status.HTTP_200_OK)
async def get_region(
    region_id: str,
    region_service: Annotated[RegionService, Depends()],
) -> RegionResponse:
    result = await region_service.get_region_by_id(id=region_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No such region id"
        )
    return RegionResponse.model_validate(result)
