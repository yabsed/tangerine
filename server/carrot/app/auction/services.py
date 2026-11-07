from datetime import datetime, timezone
from typing import List, Annotated

from fastapi import Depends
from sqlalchemy import select

from sqlalchemy.ext.asyncio import AsyncSession
from carrot.app.auction.models import Auction, AuctionStatus, Bid
from carrot.app.auction.schemas import AuctionCreate
from carrot.app.auction.repositories import AuctionRepository
from carrot.db.connection import get_db_session

from carrot.app.auction.exceptions import (
    AuctionAlreadyExistsError, 
    AuctionNotFoundError, 
    NotAllowedActionError
)

from carrot.app.product.models import Product
from carrot.app.product.schemas import ProductPostRequest

class AuctionService:
    def __init__(
        self, 
        repository: AuctionRepository, 
        db_session: AsyncSession
    ) -> None:
        self.repository = repository
        self.db_session = db_session

    @classmethod
    def create(cls, db_session: Annotated[AsyncSession, Depends(get_db_session)]) -> "AuctionService":
        """세션을 공유하는 서비스 인스턴스 생성"""
        return cls(
            repository=AuctionRepository(db_session),
            db_session=db_session
        )

    async def create_auction_with_product(self, owner_id: str, region_id: str, product_data: ProductPostRequest, auction_data: AuctionCreate) -> Auction:
        product = Product(
            owner_id=owner_id,
            title=product_data.title,
            image_ids=product_data.image_ids,
            content=product_data.content,
            price=product_data.price,
            category_id=product_data.category_id,
            region_id=region_id,
        )
        
        auction = Auction(
            starting_price=auction_data.starting_price,
            current_price=auction_data.starting_price,
            end_at=auction_data.end_at,
            status=AuctionStatus.ACTIVE
        )

        return await self.repository.create_auction(product, auction)

    async def update_auction(self, auction: Auction) -> Auction:
        return await self.repository.update_auction(auction)

    async def list_auctions(self, category_id: str | None = None, region_id: str | None = None) -> List[Auction]:
        return await self.repository.get_active_auctions(category_id, region_id)
    
    async def get_auction_details(self, auction_id: str) -> Auction:
        return await self.repository.get_auction_by_id(auction_id)
    
    async def place_bid(self, auction_id: str, bidder_id: str, bid_price: int) -> Bid:
        auction = await self.repository.get_auction_by_id(auction_id)
        
        if auction.status != AuctionStatus.ACTIVE:
            raise NotAllowedActionError()
        if auction.end_at <= datetime.now():
            raise NotAllowedActionError()
        if bid_price <= auction.current_price:
            raise NotAllowedActionError()

        new_bid = Bid(
            auction_id=auction_id,
            bidder_id=bidder_id,
            bid_price=bid_price
        )
        await self.repository.add_bid_without_commit(new_bid)

        auction.current_price = bid_price
        auction.bid_count += 1
        await self.repository.update_auction_without_commit(auction)

        await self.db_session.commit()
        await self.db_session.refresh(new_bid)
        await self.db_session.refresh(auction)
        return new_bid