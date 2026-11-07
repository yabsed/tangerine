from typing import List, Dict
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # { room_id: [websocket1, websocket2, ...] } 구조로 관리
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            # 방에 아무도 없으면 방 정보 삭제
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, room_id: str, message: dict):
        # 해당 방에 연결된 모든 클라이언트에게 메시지 전송
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                # 실제 서비스에선 JSON 형식이 기본입니다.
                await connection.send_json(message)

manager = ConnectionManager()