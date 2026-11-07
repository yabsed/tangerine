from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from carrot.db.connection import get_db_session
from carrot.app.auth.services import get_current_user_from_token # 기존 인증 함수 활용

from carrot.app.chat.manager import manager

chat_ws_router = APIRouter(prefix="/ws", tags=["chat"])

@chat_ws_router.websocket("/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: str = Query(None), # wss://.../ws/1?token=ABC...
    db: AsyncSession = Depends(get_db_session)
):
    # 1. 인증 확인 (JWT 토큰 검증)
    if token is None:
        await websocket.close(code=1008) # Policy Violation
        return

    try:
        # 기존에 만든 유저 검증 함수를 비동기로 호출 (프로젝트 구조에 맞게 수정 필요)
        user = await get_current_user_from_token(token, db)
    except Exception:
        await websocket.close(code=1008)
        return

    # 2. 연결 수락 및 등록
    await manager.connect(websocket, room_id)
    
    # 입장을 알림 (선택 사항)
    await manager.broadcast_to_room(room_id, {
        "sender": "system",
        "message": f"{user.nickname}님이 입장하셨습니다."
    })

    try:
        while True:
            # 3. 메시지 수신 (JSON 형태 추천)
            data = await websocket.receive_json()
            
            # 메시지 포맷 구성
            message_packet = {
                "room_id": room_id,
                "sender_id": user.id,
                "sender_name": user.nickname,
                "message": data.get("message"),
                "type": "chat"
            }
            
            # 4. 해당 방 전체에 전송 (그룹 채팅)
            await manager.broadcast_to_room(room_id, message_packet)
            
            # (선택) 여기에 DB 저장 로직을 추가할 수 있습니다.
            
    except WebSocketDisconnect:
        # 5. 연결 종료 처리
        manager.disconnect(websocket, room_id)
        await manager.broadcast_to_room(room_id, {
            "sender": "system",
            "message": f"{user.nickname}님이 퇴장하셨습니다."
        })

    