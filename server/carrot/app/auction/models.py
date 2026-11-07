import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import String, Integer, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from typing import TYPE_CHECKING, Optional

from carrot.db.common import Base

if TYPE_CHECKING:
    from carrot.app.product.models import Product
    from carrot.app.user.models import User

class AuctionStatus(str, Enum):
    ACTIVE = "active"
    FINISHED = "finished"
    FAILED = "failed"
    CANCELED = "canceled"

class Auction(Base):
    __tablename__ = "auction"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("product.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    # starting_price: Mapped[int] = mapped_column(Integer, nullable=False)    # 시작가
    current_price: Mapped[int] = mapped_column(Integer, nullable=False)     # 현재가
    # is_sold: Mapped[bool] = mapped_column(Boolean, default=False)         # Product의 is_sold와 중복
    end_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)      # 경매 종료 시간
    bid_count: Mapped[int] = mapped_column(Integer, default=0)              # 입찰 횟수
    status: Mapped[AuctionStatus] = mapped_column(String(20), default=AuctionStatus.ACTIVE)  # 경매 상태

    product: Mapped["Product"] = relationship("Product", back_populates="auction", uselist=False)
    bids: Mapped[list["Bid"]] = relationship("Bid", back_populates="auction", cascade="all, delete-orphan")

class Bid(Base):
    __tablename__ = "bid"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    auction_id: Mapped[str] = mapped_column(String(36), ForeignKey("auction.id", ondelete="CASCADE"), nullable=False, index=True)
    bidder_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)

    bid_price: Mapped[int] = mapped_column(Integer, nullable=False)         # 입찰가
    bid_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())  # 입찰 시간

    auction: Mapped["Auction"] = relationship("Auction", back_populates="bids")
    bidder: Mapped["User"] = relationship("User")