from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.sql import Subquery
from carrot.app.chat.models import ChatRoom, ChatMessage
from fastapi import WebSocket, status, Query, Depends
from carrot.app.auth.utils import verify_and_decode_token

def get_unread_count_subquery(user_id: str) -> Subquery:
    """방별(1:1 및 그룹) 안 읽은 메시지 개수를 계산하는 통합 서브쿼리"""
    # 1:1 방 ID와 그룹 방 ID 중 존재하는 것을 하나의 컬럼으로 취급
    target_room_id = func.coalesce(ChatMessage.room_id, ChatMessage.group_room_id).label("room_id")
    
    return (
        select(
            target_room_id,
            func.count(ChatMessage.id).label("unread_count")
        )
        .where(
            and_(
                ChatMessage.sender_id != user_id,
                ChatMessage.is_read == False
            )
        )
        .group_by(target_room_id) # 묶어준 ID로 그룹화
        .subquery()
    )

def get_last_message_id_subquery() -> Subquery:
    """방별(1:1 및 그룹) 마지막 메시지 ID를 찾는 통합 서브쿼리"""
    target_room_id = func.coalesce(ChatMessage.room_id, ChatMessage.group_room_id).label("room_id")
    
    return (
        select(
            target_room_id,
            func.max(ChatMessage.id).label("last_msg_id")
        )
        .group_by(target_room_id)
        .subquery()
    )

def parse_chat_room_list_data(rows: list, user_id: str) -> list[dict]:
    """DB 조회 결과를 딕셔너리 형태의 리스트로 변환합니다."""
    rooms = []
    for row in rows:
        room_obj, last_msg, last_at, unread_count = row
        # 상대방 ID 결정 로직
        opponent_id = room_obj.user_two_id if room_obj.user_one_id == user_id else room_obj.user_one_id
        
        rooms.append({
            "room_id": room_obj.id,
            "opponent_id": opponent_id,
            "last_message": last_msg,
            "last_message_at": last_at,
            "unread_count": unread_count
        })
    return rooms

def parse_group_chat_room_list_data(raw_data):
        results = []
        for room, content, created_at, unread_count in raw_data:
            results.append({
                "room_id": room.id,
                "title": room.title,
                "description": room.description,
                "last_message": content,
                "last_message_at": created_at,
                "unread_count": unread_count,
                "max_members": room.max_members
            })
        return results

async def get_token_from_websocket(
    websocket: WebSocket,
    token: str = Query(None) # ws://.../ws/room_id?token=JWT_TOKEN
):
    if token is None:
        # 토큰이 없으면 연결 거부
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
    
    # 토큰 복호화 및 사용자 검증 (기존 로직 활용)
    user_data = await verify_and_decode_token(token) 
    if not user_data:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
        
    return user_data # 유저 객체나 유저 정보 반환