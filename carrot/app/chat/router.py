from typing import List, Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from carrot.app.chat.schemas import (
    ChatRoomRead, GroupChatCreate, MessageRead, MessageCreate, ChatRoomListRead, OpponentStatus, 
    GroupChatRead, GroupChatMemberRead, GroupChatListRead
)
from carrot.app.chat.services import chat_service 
from carrot.db.connection import get_db_session
from carrot.app.auth.utils import login_with_header
from carrot.app.user.models import User

from carrot.app.chat.websocket import websocket_endpoint
from carrot.app.chat.manager import manager


chat_router = APIRouter()
chat_router.add_api_websocket_route("/ws/{room_id}", websocket_endpoint)


### 1대1 채팅방 관련 API 엔드포인트

### 1. 채팅방 생성 및 조회
@chat_router.post("/rooms", response_model=ChatRoomRead)
async def get_or_create_room(
    opponent_id: str, 
    current_user: Annotated[User, Depends(login_with_header)], 
    db: AsyncSession = Depends(get_db_session, scope="function")
):
    room = await chat_service.get_existing_room_or_create(db, current_user.id, opponent_id)
    return room

### 2. 내 채팅방 목록 불러오기
@chat_router.get("/rooms", response_model=List[ChatRoomListRead])
async def list_my_rooms(
    current_user: Annotated[User, Depends(login_with_header)],
    db: AsyncSession = Depends(get_db_session, scope="function")
):
    rooms = await chat_service.get_user_chat_rooms(db, current_user.id)
    return rooms

### 3. 메시지 전송(이제 WebSocket으로 대체 가능, 이미지 등을 보내야하는 경우 사용하기 위해 유지)
@chat_router.post("/rooms/{room_id}/messages", response_model=MessageRead)
async def send_message(
    room_id: str, 
    msg_in: MessageCreate, 
    current_user: Annotated[User, Depends(login_with_header)], 
    db: AsyncSession = Depends(get_db_session, scope="function")
):
    new_msg = await chat_service.save_new_message(db, room_id, current_user.id, msg_in.content)
    payload = MessageRead.model_validate(new_msg).model_dump(mode="json")
    await manager.broadcast_to_room(room_id, payload)
    return new_msg

### 4. 메시지 내역 및 업데이트 확인
@chat_router.get("/rooms/{room_id}/messages", response_model=List[MessageRead])
async def get_messages(
    room_id: str, 
    # 1. 인증된 유저 객체를 주입받습니다.
    current_user: Annotated[User, Depends(login_with_header)], 
    last_id: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session, scope="function")
):
    # 2. 서비스 함수에 current_user.id를 인자로 전달합니다.
    messages = await chat_service.get_messages_after_id(
        db, 
        room_id=room_id, 
        user_id=current_user.id, # 추가된 인자
        last_id=last_id, 
        limit=limit
    )
    return messages

### 5. 읽음 처리
@chat_router.patch("/rooms/{room_id}/messages/read")
async def mark_messages_as_read(
    room_id: str, 
    current_user: Annotated[User, Depends(login_with_header)], 
    db: AsyncSession = Depends(get_db_session, scope="function")
):
    await chat_service.update_messages_read_status(db, room_id, current_user.id)
    return {"status": "success"}

### 6. 상대방 상태 확인
@chat_router.get("/rooms/{room_id}/status", response_model=OpponentStatus)
async def get_opponent_status(
    room_id: str, 
    current_user: Annotated[User, Depends(login_with_header)], 
    db: AsyncSession = Depends(get_db_session, scope="function")
):
    # 상대방의 접속 여부나 마지막 확인 시간 등을 반환할 예정입니다.
    status_info = await chat_service.get_chat_partner_status(db, room_id, current_user.id)
    return status_info


### 그룹 채팅방 관련 API 엔드포인트

### 1. 오픈 그룹 채팅방 생성 (방장)
@chat_router.post("/rooms/group", response_model=GroupChatRead)
async def create_open_group_room(
    room_in: GroupChatCreate,
    current_user: Annotated[User, Depends(login_with_header)],
    db: AsyncSession = Depends(get_db_session, scope="function")
):
    # 서비스 로직: create_open_group_room 호출
    new_room = await chat_service.create_open_group_room(
        db, 
        creator_id=current_user.id, 
        title=room_in.title, 
        description=room_in.description, 
        max_members=room_in.max_members
    )
    return new_room

### 2. 채팅방 참여 (유저 스스로 참여)
@chat_router.post("/rooms/group/{room_id}/join", response_model=GroupChatRead)
async def join_group_chat_room(
    room_id: str,
    current_user: Annotated[User, Depends(login_with_header)],
    db: AsyncSession = Depends(get_db_session, scope="function")
):
    room = await chat_service.join_group_room(db, room_id, current_user.id)
    return room

### 3. 참여자 목록 조회 (유저 정보 포함)
@chat_router.get("/rooms/group/{room_id}/members", response_model=List[GroupChatMemberRead])
async def get_group_room_members(
    room_id: str,
    current_user: Annotated[User, Depends(login_with_header)],
    db: AsyncSession = Depends(get_db_session, scope="function")
):
    # 유저가 해당 방 멤버인지 확인하는 권한 체크 로직을 서비스에 추가하면 더 좋습니다.
    members = await chat_service.get_group_room_members(db, room_id)
    return members

### 4. 채팅방 나가기 (본인) 또는 강퇴 (방장)
@chat_router.delete("/rooms/group/{room_id}/members/{target_user_id}")
async def remove_group_member(
    room_id: str,
    target_user_id: str, # 나 자신이면 leave, 타인이면 kick
    current_user: Annotated[User, Depends(login_with_header)],
    db: AsyncSession = Depends(get_db_session, scope="function")
):
    if target_user_id == current_user.id:
        # 1. 본인이 나가는 경우 (leave_group_room)
        await chat_service.leave_group_room(db, room_id, current_user.id)
        await manager.remove_user(room_id, current_user.id)
        return {"status": "success", "message": "방에서 나갔습니다."}
    else:
        # 2. 타인을 강퇴하는 경우 (kick_group_member)
        await chat_service.kick_group_member(
            db, 
            room_id=room_id, 
            target_user_id=target_user_id, 
            admin_user_id=current_user.id
        )
        await manager.remove_user(room_id, target_user_id)
        return {"status": "success", "message": f"유저 {target_user_id}를 강퇴했습니다."}

### 5. 내 그룹 채팅방 목록 불러오기
@chat_router.get("/rooms/group", response_model=List[GroupChatListRead]) # 새로 정의할 스키마
async def list_my_group_rooms(
    current_user: Annotated[User, Depends(login_with_header)],
    db: AsyncSession = Depends(get_db_session, scope="function")
):
    # 서비스 로직 호출
    rooms = await chat_service.get_user_group_chat_rooms(db, current_user.id)
    return rooms