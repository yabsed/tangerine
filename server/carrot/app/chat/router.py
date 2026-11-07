from typing import List, Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc


from carrot.app.chat.models import GroupChatRoom, ChatRoom, ChatMessage, GroupChatMember
from carrot.app.chat.schemas import (
    ChatRoomRead, GroupChatCreate, MessageRead, MessageCreate, ChatRoomListRead, OpponentStatus, 
    GroupChatRead, GroupChatMemberRead, GroupChatListRead
)
from carrot.app.chat.services import chat_service 
from carrot.db.connection import get_db_session
from carrot.app.auth.utils import login_with_header
from carrot.app.user.models import User

# For WebSocket management
import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession

from carrot.db.connection import get_session_factory
from carrot.app.chat.manager import manager
from carrot.app.auth.utils import verify_and_decode_token
from carrot.app.auth.settings import AUTH_SETTINGS

from carrot.app.auth.exceptions import (
    InvalidTokenException,
)



chat_router = APIRouter()

### WebSocket 엔드포인트
@chat_router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    room_id: str,
    session_factory: async_sessionmaker = Depends(get_session_factory)
):
    await websocket.accept()
    current_user_id = None
    
    try:
        # 1. [인증] 첫 메시지로 토큰 받기
        try:
            auth_data = await asyncio.wait_for(websocket.receive_json(), timeout=5.0)
            token = auth_data.get("token")
            
            claims = verify_and_decode_token(token, AUTH_SETTINGS.ACCESS_TOKEN_SECRET)
            current_user_id = claims.get("sub") 
            
            if not current_user_id:
                raise InvalidTokenException()
                
        except (asyncio.TimeoutError, InvalidTokenException, Exception):
            await websocket.close(code=4003)
            return

        # 2. 매니저 등록 (기존 매니저 사용 가능)
        await manager.connect(websocket, room_id)

        # 3. 메인 대화 루프
        while True:
            data = await websocket.receive_json()
            content = data.get("content")
            
            async with session_factory() as session:
                try:
                    # [핵심 로직] 어느 테이블에 저장할지 결정
                    # 1:1 방인지 먼저 확인
                    room_stmt = select(ChatRoom).where(ChatRoom.id == room_id)
                    is_direct = (await session.execute(room_stmt)).scalar_one_or_none()
                    
                    if is_direct:
                        # 1:1 채팅 메시지 저장
                        new_msg = ChatMessage(
                            room_id=room_id, 
                            sender_id=current_user_id, 
                            content=content
                        )
                    else:
                        # 그룹 채팅방 멤버인지 확인 후 저장
                        group_stmt = select(GroupChatMember).where(
                            and_(GroupChatMember.room_id == room_id, GroupChatMember.user_id == current_user_id)
                        )
                        is_member = (await session.execute(group_stmt)).scalar_one_or_none()
                        
                        if not is_member:
                            await websocket.send_json({"error": "이 방의 멤버가 아닙니다."})
                            continue
                            
                        new_msg = ChatMessage(
                            group_room_id=room_id, # 수정된 모델 필드!
                            sender_id=current_user_id, 
                            content=content
                        )

                    session.add(new_msg)
                    await session.commit()
                    await session.refresh(new_msg)
                    
                    # 브로드캐스트
                    await manager.broadcast_to_room(room_id, {
                        "message_id": new_msg.id,
                        "sender_id": current_user_id,
                        "content": new_msg.content,
                        "created_at": new_msg.created_at.isoformat(),
                        "is_group": not is_direct # 프론트에서 구분하기 쉽게 추가
                    })

                except Exception as e:
                    await session.rollback()
                    print(f"❌ WS Message Error: {e}")
                    await websocket.send_json({"error": "메시지 전송 실패"})

    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

### 1대1 채팅방 관련 API 엔드포인트

### 1. 채팅방 생성 및 조회
@chat_router.post("/rooms", response_model=ChatRoomRead)
async def get_or_create_room(
    opponent_id: str, 
    current_user: Annotated[User, Depends(login_with_header)], 
    db: AsyncSession = Depends(get_db_session)
):
    room = await chat_service.get_existing_room_or_create(db, current_user.id, opponent_id)
    return room

### 2. 내 채팅방 목록 불러오기
@chat_router.get("/rooms", response_model=List[ChatRoomListRead])
async def list_my_rooms(
    current_user: Annotated[User, Depends(login_with_header)],
    db: AsyncSession = Depends(get_db_session)
):
    rooms = await chat_service.get_user_chat_rooms(db, current_user.id)
    return rooms

### 3. 메시지 전송(이제 WebSocket으로 대체 가능, 이미지 등을 보내야하는 경우 사용하기 위해 유지)
@chat_router.post("/rooms/{room_id}/messages", response_model=MessageRead)
async def send_message(
    room_id: str, 
    msg_in: MessageCreate, 
    current_user: Annotated[User, Depends(login_with_header)], 
    db: AsyncSession = Depends(get_db_session)
):
    new_msg = await chat_service.save_new_message(db, room_id, current_user.id, msg_in.content)
    return new_msg

### 4. 메시지 내역 및 업데이트 확인
@chat_router.get("/rooms/{room_id}/messages", response_model=List[MessageRead])
async def get_messages(
    room_id: str, 
    # 1. 인증된 유저 객체를 주입받습니다.
    current_user: Annotated[User, Depends(login_with_header)], 
    last_id: int = 0, 
    limit: int = 50, 
    db: AsyncSession = Depends(get_db_session)
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
    db: AsyncSession = Depends(get_db_session)
):
    await chat_service.update_messages_read_status(db, room_id, current_user.id)
    return {"status": "success"}

### 6. 상대방 상태 확인
@chat_router.get("/rooms/{room_id}/status", response_model=OpponentStatus)
async def get_opponent_status(
    room_id: str, 
    current_user: Annotated[User, Depends(login_with_header)], 
    db: AsyncSession = Depends(get_db_session)
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
    db: AsyncSession = Depends(get_db_session)
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
    db: AsyncSession = Depends(get_db_session)
):
    room = await chat_service.join_group_room(db, room_id, current_user.id)
    return room

### 3. 참여자 목록 조회 (유저 정보 포함)
@chat_router.get("/rooms/group/{room_id}/members", response_model=List[GroupChatMemberRead])
async def get_group_room_members(
    room_id: str,
    current_user: Annotated[User, Depends(login_with_header)],
    db: AsyncSession = Depends(get_db_session)
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
    db: AsyncSession = Depends(get_db_session)
):
    if target_user_id == current_user.id:
        # 1. 본인이 나가는 경우 (leave_group_room)
        await chat_service.leave_group_room(db, room_id, current_user.id)
        return {"status": "success", "message": "방에서 나갔습니다."}
    else:
        # 2. 타인을 강퇴하는 경우 (kick_group_member)
        await chat_service.kick_group_member(
            db, 
            room_id=room_id, 
            target_user_id=target_user_id, 
            admin_user_id=current_user.id
        )
        return {"status": "success", "message": f"유저 {target_user_id}를 강퇴했습니다."}

### 5. 내 그룹 채팅방 목록 불러오기
@chat_router.get("/rooms/group", response_model=List[GroupChatListRead]) # 새로 정의할 스키마
async def list_my_group_rooms(
    current_user: Annotated[User, Depends(login_with_header)],
    db: AsyncSession = Depends(get_db_session)
):
    # 서비스 로직 호출
    rooms = await chat_service.get_user_group_chat_rooms(db, current_user.id)
    return rooms