from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional

from carrot.app.user.schemas import UserResponse

# 메시지 전송 요청
class MessageCreate(BaseModel):
    content: str

# 메시지 응답 형식
class MessageRead(BaseModel):
    id: int
    room_id: str
    sender_id: str
    content: str
    created_at: datetime
    is_read: bool

    class Config:
        from_attributes = True

# 채팅방 정보 응답
class ChatRoomRead(BaseModel):
    id: str
    user_one_id: str
    user_two_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# 내 채팅방 목록 조회 응답 (리스트 화면용)
class ChatRoomListRead(BaseModel):
    room_id: str
    opponent_id: str
    opponent_nickname: Optional[str] = None      # 상대방 닉네임 (선택사항)
    opponent_profile_image: Optional[str] = None # 상대방 프로필 이미지 (선택사항)
    last_message: Optional[str] = None           # 마지막 메시지 내용
    last_message_at: Optional[datetime] = None   # 마지막 메시지 시간
    unread_count: int = 0                        # 안 읽은 메시지 수

    class Config:
        from_attributes = True

# 상대방 상태 확인 응답
class OpponentStatus(BaseModel):
    user_id: str
    nickname: Optional[str] = None
    profile_image: Optional[str] = None
    # 'status'는 기존 User 모델의 UserStatus Enum을 사용하거나 문자열로 처리
    status: str                                  
    last_active_at: Optional[datetime] = None    # 마지막 활동 시간 (필요 시)

    class Config:
        from_attributes = True

# --- 그룹 채팅 멤버 스키마 ---
class GroupChatMemberRead(BaseModel):
    id: int
    user_id: str
    room_id: str
    is_admin: bool
    joined_at: datetime
    # 서비스 로직에서 joinedload로 가져온 유저 정보를 담습니다.
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)

# --- 그룹 채팅방 스키마 ---
class GroupChatCreate(BaseModel):
    title: str
    description: Optional[str] = None
    max_members: int = 100

class GroupChatRead(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    max_members: int
    created_at: datetime
    members: List["GroupChatMemberRead"] = []

    model_config = ConfigDict(from_attributes=True)

class GroupChatListRead(BaseModel):
    room_id: str
    title: str
    last_message: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    member_count: int = 0  # 현재 몇 명 참여 중인지 보여주면 좋음

    model_config = ConfigDict(from_attributes=True)