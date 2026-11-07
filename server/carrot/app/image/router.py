from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from carrot.db.connection import get_session_factory
from carrot.app.image.schemas import ImageResponse
from carrot.app.image.services import ImageService

image_router = APIRouter()


@image_router.post("/product", status_code=201, response_model=ImageResponse)
async def upload_product_image(
    session: Annotated[AsyncSession, Depends(get_session_factory)],
    file: UploadFile = File(...),
) -> ImageResponse:
    service = ImageService(session)
    async with session.begin():
        image = await service.upload_image(file)
    return ImageResponse.model_validate(image)


@image_router.post("/user", status_code=201, response_model=ImageResponse)
async def upload_profile_image(
    session: Annotated[AsyncSession, Depends(get_session_factory)],
    file: UploadFile = File(...),
) -> ImageResponse:
    service = ImageService(session)
    async with session.begin():
        image = await service.upload_image(file)
    return ImageResponse.model_validate(image)


@image_router.get("/product/{image_id}", status_code=200, response_model=ImageResponse)
async def view_product_image(
    session: Annotated[AsyncSession, Depends(get_session_factory)],
    image_id: str,
) -> ImageResponse:
    service = ImageService(session)
    image = await service.view_image(image_id)
    return ImageResponse.model_validate(image)


@image_router.get("/user/{image_id}", status_code=200, response_model=ImageResponse)
async def view_profile_image(
    session: Annotated[AsyncSession, Depends(get_session_factory)],
    image_id: str,
) -> ImageResponse:
    service = ImageService(session)
    image = await service.view_image(image_id)
    return ImageResponse.model_validate(image)
