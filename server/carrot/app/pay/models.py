from datetime import datetime
import enum
import uuid
from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from carrot.app.user.models import User
from carrot.db.common import Base


class TransactionType(enum.Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAW = "WITHDRAW"
    TRANSFER = "TRANSFER"


class Ledger(Base):
    __tablename__ = "ledger"

    id: Mapped[str] = mapped_column(
        String(512), primary_key=True
    )

    transaction_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, native_enum=False), nullable=False
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=True)
    time: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("user.id", ondelete="CASCADE")
    )
    receive_user_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("user.id", ondelete="CASCADE"), nullable=True
    )

    user: Mapped[User] = relationship(
        "User", foreign_keys=[user_id], back_populates="sent_ledgers"
    )
    receive_user: Mapped[User | None] = relationship(
        "User", foreign_keys=[receive_user_id], back_populates="received_ledgers"
    )
