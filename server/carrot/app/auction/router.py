from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Annotated

from carrot.db.connection import get_db_session
from carrot.app.auth.utils import login_with_header

from carrot.app.auction.services import AuctionService
from carrot.app.auction.schemas import AuctionListResponse, AuctionResponse, BidCreate, BidResponse # Pydantic 모델 가정

from carrot.app.user.models import User

from carrot.app.product.schemas import ProductPostRequest

auction_router = APIRouter()

# # 1. 경매 등록
# @auction_router.post("/", response_model=AuctionResponse)
# async def create_new_auction(
#     owner: Annotated[User, Depends(login_with_header)],
#     product_data: ProductPostRequest,
#     auction_data: AuctionCreate,
#     service: Annotated[AuctionService, Depends(AuctionService.create)],
# ) -> AuctionResponse:
#     auction = await service.create_auction_with_product(
#         owner_id=owner.id,
#         region_id=owner.region_id,
#         product_data=product_data,
#         auction_data=auction_data
#     )
#     return AuctionResponse.model_validate(auction)

# 2. 경매 목록 조회 (카테고리, 지역 필터링)
@auction_router.get("/", response_model=List[AuctionListResponse])
async def get_auctions(
    service: Annotated[AuctionService, Depends(AuctionService.create)],
    category_id: Optional[str] = Query(None, description="카테고리 ID로 필터링"),
    region_id: Optional[str] = Query(None, description="지역 ID로 필터링"),
) -> List[AuctionListResponse]:
    auctions = await service.list_auctions(category_id, region_id)
    return [AuctionListResponse.model_validate(a) for a in auctions]

# # 3. 경매 상세 조회
# @auction_router.get("/{auction_id}", response_model=AuctionResponse)
# async def get_auction_detail(
#     auction_id: str,
#     service: Annotated[AuctionService, Depends(AuctionService.create)],
# ) -> AuctionResponse:
#     auction = await service.get_auction_details(auction_id)
#     return AuctionResponse.model_validate(auction)

# 4. 입찰하기
@auction_router.post("/{auction_id}/bids", response_model=BidResponse)
async def place_bid(
    auction_id: str,
    bid_data: BidCreate,
    bidder: Annotated[User, Depends(login_with_header)],
    service: Annotated[AuctionService, Depends(AuctionService.create)],
) -> BidResponse:

    bid = await service.place_bid(
        auction_id=auction_id,
        bidder_id=bidder.id,
        bid_price=bid_data.bid_price
    )

    return BidResponse.model_validate(bid)