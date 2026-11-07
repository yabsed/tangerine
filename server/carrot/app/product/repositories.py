from typing import List

from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from carrot.app.product.models import Product
from carrot.app.auction.models import Auction


class ProductRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_post(self, product: Product) -> Product:
        self.session.add(product)
        await self.session.flush()
        await self.session.refresh(product)
        return product

    async def create_auction(self, auction: Auction) -> Auction:
        self.session.add(auction)
        await self.session.flush()
        await self.session.refresh(auction)
        return auction
    
    async def update_post(self, product: Product) -> Product:
        merged = await self.session.merge(product)
        await self.session.flush()
        await self.session.refresh(merged)
        return merged

    async def get_post_by_product_id(self, product_id: str, with_auction: bool = False) -> Product | None:
        query = select(Product).where(Product.id == product_id)

        if with_auction:
            query = query.options(selectinload(Product.auction))

        result = await self.session.execute(query)
        return result.scalars().one_or_none()

    async def get_posts_by_query(
        self,
        user_id: str | None,
        keyword: str | None,
        region_id: str | None,
        with_auction: bool = False,
    ) -> List[Product]:
        query = select(Product)

        # 1. 필터링 로직 추가: with_auction이 False이면 Auction이 없는 것만 가져옴
        if not with_auction:
            # Product와 Auction을 Outer Join 한 뒤, Auction 데이터가 없는 것(None)만 필터링
            query = query.outerjoin(Product.auction).where(Auction.id == None)
        else:
            # Auction이 있는 것만 혹은 전체를 가져오고 싶다면 상황에 맞춰 innerjoin 등으로 변경 가능
            # 현재는 'auction 정보를 포함해서' 가져온다는 의미로 selectinload 유지
            query = query.options(selectinload(Product.auction))

        if user_id:
            query = query.where(Product.owner_id == user_id)

        if keyword:
            search_pattern = f"%{keyword}%"
            query = query.where(
                or_(
                    Product.title.ilike(search_pattern),
                    Product.content.ilike(search_pattern),
                )
            )

        if region_id:
            query = query.where(Product.region_id == region_id)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_posts_all(self, with_auction: bool = False) -> List[Product]:
        query = select(Product)

        if not with_auction:
            # 경매 상품 제외 (Auction ID가 없는 것만)
            query = query.outerjoin(Product.auction).where(Auction.id == None)
        else:
            query = query.options(selectinload(Product.auction))

        result = await self.session.execute(query)
        return result.scalars().all()

    async def remove_post(self, product: Product) -> None:
        await self.session.delete(product)
        await self.session.flush()
