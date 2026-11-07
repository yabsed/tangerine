from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

from carrot.db.connection import get_session_factory

from carrot.app.product.models import Product
from carrot.app.auction.models import Auction, AuctionStatus
from carrot.app.product.repositories import ProductRepository
from carrot.app.product.exceptions import NotYourProductException, InvalidProductIDException
from carrot.app.auction.exceptions import NotAllowedActionError

from carrot.app.image.services import ImageService
from carrot.app.product.schemas import ProductPostRequest
from carrot.app.auction.schemas import AuctionCreate


class ProductService:
    def __init__(self, session: AsyncSession = Depends(get_session_factory)) -> None:
        self.session = session
        self.repository = ProductRepository(session)
        self.image_service = ImageService(session)

    async def create_post(
        self,
        user_id: str,
        product_request: ProductPostRequest,
        region_id: str,
        auction_data: AuctionCreate | None,
    ) -> Product:
        async with self.session.begin():  # ✅ 여기서 트랜잭션 시작/커밋/롤백
            product = Product(
                owner_id=user_id,
                title=product_request.title,
                image_ids=product_request.image_ids,
                content=product_request.content,
                price=product_request.price,
                category_id=product_request.category_id,
                region_id=region_id,
            )

            new_product = await self.repository.create_post(product)

            if auction_data is not None:
                auction = Auction(
                    product_id=new_product.id,
                    current_price=new_product.price,
                    end_at=auction_data.end_at,
                )
                await self.repository.create_auction(auction)

        # begin 블록을 나가면 commit된 상태
        # 필요하면 최신 상태 반영(선택)
        await self.session.refresh(new_product, attribute_names=["auction"])
        return new_product

    async def update_post(
        self,
        user_id: str,
        id: str,
        title: str,
        image_ids: list,
        content: str,
        price: int,
        category_id: str,
        region_id: str,
        is_sold: bool,
    ) -> Product:
        async with self.session.begin():
            # auction까지 같이 로딩해서 판단
            product = await self.repository.get_post_by_product_id(id, with_auction=True)

            if product is None:
                raise InvalidProductIDException

            if user_id != product.owner_id:
                raise NotYourProductException

            # ✅ 경매 붙은 상품이면 수정 금지
            if product.auction is not None:
                raise NotAllowedActionError

            product.title = title
            product.image_ids = image_ids
            product.content = content
            product.category_id = category_id
            product.region_id = region_id
            product.is_sold = is_sold

            # price는 경매 아닌 경우만 반영
            if product.auction is None:
                product.price = price

            updated = await self.repository.update_post(product)

        await self.session.refresh(updated)
        return updated

    async def view_post_by_product_id(self, product_id: str):
        product = await self.repository.get_post_by_product_id(
            product_id,
            with_auction=True,
        )

        if product is None:
            raise InvalidProductIDException

        return product

    async def view_posts_by_query(self, user_id: str | None, keyword: str | None, region_id: str | None):
        products = await self.repository.get_posts_by_query(
            user_id=user_id,
            keyword=keyword,
            region_id=region_id,
            with_auction=False,
        )
        return products

    async def view_posts_all(self):
        products = await self.repository.get_posts_all(with_auction=False)
        return products

    async def remove_post(self, user_id: str, product_id: str) -> None:
        async with self.session.begin():
            product = await self.repository.get_post_by_product_id(product_id, with_auction=True)

            if product is None:
                raise InvalidProductIDException
            if user_id != product.owner_id:
                raise NotYourProductException
            if product.auction is not None and product.auction.status == AuctionStatus.ACTIVE:
                raise NotAllowedActionError

            image_ids = list(product.image_ids or [])
            await self.repository.remove_post(product)

        # 트랜잭션 밖에서 이미지 best-effort 삭제
        for image_id in image_ids:
            try:
                await self.image_service.remove_product_image(image_id)
            except Exception:
                pass
