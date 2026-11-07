from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from carrot.app.image.models import Image


class ImageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def upload_image(self, image: Image) -> Image:
        self.session.add(image)
        await self.session.flush()
        await self.session.refresh(image)
        return image

    async def get_image_by_image_id(self, image_id: str) -> Image | None:
        query = select(Image).where(Image.id == image_id)
        result = await self.session.execute(query)
        return result.scalars().one_or_none()

    async def remove_image(self, image: Image) -> None:
        await self.session.delete(image)
        await self.session.flush()
