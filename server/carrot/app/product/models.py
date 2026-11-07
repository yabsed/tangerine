import uuid
from sqlalchemy import String, Integer, ForeignKey, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING

from carrot.db.common import Base

from carrot.app.user.models import User
from carrot.app.category.models import Category
from carrot.app.region.models import Region
    
class Product(Base):
    __tablename__ = "product"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    owner_id:  Mapped[str] = mapped_column(String(36), ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("category.id", ondelete="CASCADE"), nullable=False, index=True)
    region_id: Mapped[str] = mapped_column(String(36), ForeignKey("region.id", ondelete="CASCADE"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(50))
    image_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    content: Mapped[str | None] = mapped_column(String(500))
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    is_sold: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship("User")
    category: Mapped[Category] = relationship("Category")
    region: Mapped[Region] = relationship("Region")
    
    auction: Mapped["Auction"] = relationship("Auction", back_populates="product", uselist=False, cascade="all, delete-orphan")
    
class UserProduct(Base):
    __tablename__ = "user_product"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("product.id", ondelete="CASCADE"), nullable=False, index=True)
    like: Mapped[bool] = mapped_column(Boolean, default=False)

    
    user: Mapped[User] = relationship("User")
    product: Mapped[Product] = relationship("Product")