import os
import uuid

import boto3
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from carrot.app.image.models import Image
from carrot.app.image.repositories import ImageRepository


IMAGE_BUCKET = os.environ["S3_IMAGE_BUCKET"]
if not IMAGE_BUCKET or IMAGE_BUCKET == os.environ.get("S3_BUCKET"):
    raise RuntimeError("S3_IMAGE_BUCKET must be a separate image bucket.")

s3_client = boto3.client("s3")
IMAGE_ORIGIN = f"https://{IMAGE_BUCKET}.s3.{s3_client.meta.region_name}.amazonaws.com"


def store_image(file, image_id):
    s3_client.upload_fileobj(
        file.file,
        IMAGE_BUCKET,
        f"images/{image_id}",
        ExtraArgs={
            "ContentType": file.content_type,
            "CacheControl": "public, max-age=86400",
        },
    )


class ImageService:
    def __init__(self, session: AsyncSession) -> None:
        self.repository = ImageRepository(session)

    async def upload_image(self, file) -> Image:
        if file.content_type not in {"image/jpeg", "image/png", "image/webp", "image/gif"}:
            raise HTTPException(status_code=415, detail="Unsupported image type.")
        if file.size is None or file.size > 5 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Images must be at most 5 MB.")

        image_id = str(uuid.uuid4())
        await run_in_threadpool(store_image, file, image_id)

        image = Image(id=image_id, image_url=f"{IMAGE_ORIGIN}/images/{image_id}")
        return await self.repository.upload_image(image)

    async def view_image(self, image_id: str) -> Image:
        image = await self.repository.get_image_by_image_id(image_id)
        if image is None:
            raise HTTPException(status_code=404, detail="Image not found.")
        return image

    async def remove_product_image(self, image_id: str) -> None:
        image = await self.repository.get_image_by_image_id(image_id)
        await self.repository.remove_image(image)
