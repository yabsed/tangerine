import uuid
import enum

from sqlalchemy import String, Integer, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from carrot.db.common import Base

from carrot.app.region.models import Region


class UserStatus(enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"


class User(Base):
    __tablename__ = "user"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(String(60), unique=True, index=True)

    nickname: Mapped[str | None] = mapped_column(String(20))
    profile_image: Mapped[str | None] = mapped_column(String(150))
    coin: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    region_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("region.id", ondelete="CASCADE"), index=True
    )
    region: Mapped[Region | None] = relationship("Region")

    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus), default=UserStatus.PENDING, nullable=False
    )

    local_account: Mapped["LocalAccount"] = relationship(
        "LocalAccount", back_populates="user"
    )

    social_account: Mapped["SocialAccount"] = relationship(
        "SocialAccount", back_populates="user"
    )

    sent_ledgers: Mapped["Ledger"] = relationship(
        "Ledger", foreign_keys="[Ledger.user_id]", back_populates="user"
    )
    received_ledgers: Mapped["Ledger"] = relationship(
        "Ledger", foreign_keys="[Ledger.receive_user_id]", back_populates="receive_user"
    )
    # Set relationships to 1:1 ChatRoom
    chat_rooms_v1: Mapped[list["ChatRoom"]] = relationship(
        "ChatRoom", foreign_keys="[ChatRoom.user_one_id]", back_populates="user_one"
    )
    chat_rooms_v2: Mapped[list["ChatRoom"]] = relationship(
        "ChatRoom", foreign_keys="[ChatRoom.user_two_id]", back_populates="user_two"
    )


class LocalAccount(Base):
    __tablename__ = "local_account"
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("user.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user: Mapped[User] = relationship("User", back_populates="local_account")
    hashed_password: Mapped[str] = mapped_column(String(100))


class SocialAccount(Base):
    __tablename__ = "social_account"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("user.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user: Mapped[User] = relationship("User", back_populates="social_account")

    provider: Mapped[str] = mapped_column(String(20))
    provider_sub: Mapped[str] = mapped_column(String(256))
