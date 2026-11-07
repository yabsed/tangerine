import uuid
from sqlalchemy import String, Integer, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from carrot.db.common import Base
from carrot.app.user.models import User

class Image(Base):
    __tablename__ = "image"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    image_url: Mapped[str] = mapped_column(String(255), nullable=False)