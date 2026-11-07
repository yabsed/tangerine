from typing import Annotated, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload, joinedload, contains_eager
from datetime import datetime
from fastapi import Depends

from carrot.app.auction.models import Auction, Bid, AuctionStatus
from carrot.app.product.models import Product
from carrot.db.connection import get_db_session

from carrot.app.auction.exceptions import (
    AuctionAlreadyExistsError,
    AuctionNotFoundError,
    NotAllowedActionError
)

class AuctionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session


    async def create_auction(self, product: Product, auction: Auction) -> Auction:
        self.session.add(product)
        await self.session.flush()  # Ensure product ID is generated

        auction.product_id = product.id
        self.session.add(auction)
        
        await self.session.commit()
        await self.session.refresh(auction, attribute_names=["product"])
        return auction
    
    async def get_auction_by_id(self, auction_id: str) -> Optional[Auction]:
        # 1. 쿼리 작성 (bids 로딩 제거)
        stmt = (
            select(Auction)
            .where(Auction.id == auction_id)
            .options(joinedload(Auction.product))  # 상품 정보는 보통 같이 필요하니까요!
        )
        
        result = await self.session.execute(stmt)
        
        # 2. 결과 추출
        # 이제 1:N 조인이 없으므로 .unique()가 없어도 에러는 안 나지만, 
        # 관습적으로 넣어두거나 scalar_one_or_none()으로 안전하게 받습니다.
        auction = result.scalar_one_or_none()

        if not auction:
            raise AuctionNotFoundError()

        return auction

    async def get_active_auctions(
        self,
        category_id: Optional[str] = None,
        region_id: Optional[str] = None,
    ) -> List[Auction]:
        stmt = (
            select(Auction)
            .where(Auction.status == AuctionStatus.ACTIVE)
            .options(selectinload(Auction.product))
            .order_by(Auction.end_at.asc())
        )

        # ✅ 필터가 있을 때만 join 한 번
        if category_id or region_id:
            stmt = stmt.join(Auction.product)

            if category_id:
                stmt = stmt.where(Product.category_id == category_id)

            if region_id:
                stmt = stmt.where(Product.region_id == region_id)

        result = await self.session.execute(stmt)
        return result.scalars().unique().all()

    async def delete_auction(self, auction: Auction) -> None:
        await self.session.delete(auction)
        await self.session.commit()

    async def update_auction(self, auction: Auction) -> Auction:
        merged = await self.session.merge(auction)
        await self.session.commit()
        return merged
    
    async def update_auction_without_commit(self, auction: Auction) -> Auction:
        merged = await self.session.merge(auction)
        return merged
    
    async def add_bid_without_commit(self, bid: Bid) -> Bid:
        self.session.add(bid)
        return bid

    async def place_bid(self, bid: Bid) -> Bid:
        self.session.add(bid)
        await self.session.commit()
        await self.session.refresh(bid)
        return bid

    async def update_bid(self, bid: Bid) -> Bid:
        merged = await self.session.merge(bid)
        await self.session.commit()
        await self.session.refresh(merged)
        return merged

    async def gets_user_bids(self, user_id: str) -> List[Bid]:
        stmt = (
            select(Bid)
            .where(Bid.bidder_id == user_id)
            .options(joinedload(Bid.auction).joinedload(Auction.product))
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    