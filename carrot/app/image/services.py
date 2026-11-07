import os
import uuid

import boto3
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from carrot.app.image.models import Image
from carrot.app.image.repositories import ImageRepository


BUCKET_NAME = os.environ.get("S3_BUCKET", "")
PUBLIC_API_URL = os.environ.get("PUBLIC_API_URL", "http://localhost:8000").rstrip("/")
s3_client = boto3.client("s3")


def store_image(file, image_id):
    s3_client.upload_fileobj(
        file.file,
        BUCKET_NAME,
        f"images/{image_id}",
        ExtraArgs={"ContentType": file.content_type},
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
        image = Image(id=image_id, image_url=f"{PUBLIC_API_URL}/api/image/{image_id}/file")
        return await self.repository.upload_image(image)

    async def view_image(self, image_id: str) -> Image:
        return await self.repository.get_image_by_image_id(image_id)

    async def remove_product_image(self, image_id: str) -> None:
        image = await self.repository.get_image_by_image_id(image_id)
        await self.repository.remove_image(image)


def image_content(image_id: uuid.UUID):
    try:
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=f"images/{image_id}")
    except s3_client.exceptions.NoSuchKey:
        raise HTTPException(status_code=404, detail="Image not found.")

    def chunks():
        with response["Body"] as body:
            yield from body.iter_chunks(64 * 1024)

    return chunks(), response["ContentType"]
