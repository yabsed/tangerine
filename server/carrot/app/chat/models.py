import uuid
from datetime import datetime
from sqlalchemy import String, Integer, ForeignKey, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from carrot.db.common import Base
from sqlalchemy.sql import func

from carrot.app.user.models import User
from carrot.app.product.models import Product

# ChatRoom: 1대1 채팅방 정보를 담는 테이블
class ChatRoom(Base):
    __tablename__ = "chat_room"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )
    
    # 1대1 채팅이므로 참여자 A와 B의 ID를 저장합니다.
    user_one_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), index=True)
    user_two_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"), index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # 관계 설정
    messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="room", cascade="all, delete-orphan")
    user_one: Mapped["User"] = relationship("User", foreign_keys=[user_one_id])
    user_two: Mapped["User"] = relationship("User", foreign_keys=[user_two_id])


# ChatMessage: 개별 메시지 데이터를 담는 테이블
class ChatMessage(Base):
    __tablename__ = "chat_message"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # 1:1 채팅방 연결 (선택적)
    room_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("chat_room.id", ondelete="CASCADE"), index=True, nullable=True
    )
    # 그룹 채팅방 연결 추가 (선택적)
    group_room_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("group_chat_room.id", ondelete="CASCADE"), index=True, nullable=True
    )
    
    sender_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), index=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    # 관계 설정
    room: Mapped["ChatRoom"] = relationship("ChatRoom", back_populates="messages")
    group_room: Mapped["GroupChatRoom"] = relationship("GroupChatRoom", back_populates="messages")
    sender: Mapped["User"] = relationship("User")

# 그룹/오픈 채팅 전용 방
class GroupChatRoom(Base):
    __tablename__ = "group_chat_room"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=True)
    max_members: Mapped[int] = mapped_column(Integer, default=100)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # 관계 설정
    messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="group_room", cascade="all, delete-orphan"
    )
    members: Mapped[list["GroupChatMember"]] = relationship("GroupChatMember", back_populates="room", cascade="all, delete-orphan")

# 그룹 채팅 멤버 (방장 정보 포함)
class GroupChatMember(Base):
    __tablename__ = "group_chat_member"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    room_id: Mapped[str] = mapped_column(String(36), ForeignKey("group_chat_room.id", ondelete="CASCADE"))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("user.id", ondelete="CASCADE"))
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # 관계 설정
    user: Mapped["User"] = relationship("User")
    room: Mapped["GroupChatRoom"] = relationship("GroupChatRoom", back_populates="members")