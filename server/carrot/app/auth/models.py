from datetime import datetime

from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from carrot.db.common import Base

class BlockedToken(Base):
    __tablename__ = "blocked_tokens"

    token: Mapped[str] = mapped_column(String(512), primary_key=True)
    expired_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)