from pydantic import BaseModel, Field, field_validator
from datetime import datetime, timezone
from typing import List, Optional
from enum import Enum

from sqlalchemy import func

# 경매 상태 Enum (모델과 맞춤)
class AuctionStatus(str, Enum):
    ACTIVE = "active"
    FINISHED = "finished"
    FAILED = "failed"
    CANCELED = "canceled"

class AuctionCreate(BaseModel):
    # starting_price: int = Field(..., gt=0, description="경매 시작 가격")
    end_at: datetime = Field(..., description="경매 종료 시간")

    @field_validator("end_at")
    @classmethod  # Pydantic V2에서는 classmethod로 정의하는 것이 정석입니다.
    def validate_end_at(cls, v: datetime) -> datetime:
        # v에 시간대 정보가 없다면 UTC로 가정
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
            
        # 현재 시간을 UTC 기준으로 가져옴
        current_time = datetime.now(timezone.utc)
        
        if v <= current_time:
            raise ValueError("경매 종료 시간은 현재 시간보다 미래여야 합니다.")
        return v
    
class AuctionProductSummary(BaseModel):
    id: str
    owner_id: str
    title: str
    image_ids: List[str]
    content: str | None
    price: int
    like_count: int
    category_id: str
    region_id: str
    is_sold: bool

    class Config:
        from_attributes = True
    
class AuctionListResponse(BaseModel):
    id: str
    product_id: str
    current_price: int
    end_at: datetime
    bid_count: int
    status: AuctionStatus

    product: AuctionProductSummary

    class Config:
        from_attributes = True

class AuctionResponse(BaseModel):
    id: str
    product_id: str
    current_price: int
    end_at: datetime
    bid_count: int
    status: AuctionStatus

    class Config:
        from_attributes = True

class BidCreate(BaseModel):
    bid_price: int = Field(..., gt=0)

class BidResponse(BaseModel):
    id: str
    auction_id: str
    bidder_id: str
    bid_price: int
    bid_at: datetime
    
    class Config:
        from_attributes = True

