import asyncio

from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    def __init__(self):
        self.rooms: dict[str, dict[WebSocket, str]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        self.rooms.setdefault(room_id, {})[websocket] = user_id

    def disconnect(self, websocket: WebSocket, room_id: str):
        room = self.rooms.get(room_id, {})
        room.pop(websocket, None)
        if not room:
            self.rooms.pop(room_id, None)

    async def broadcast_to_room(self, room_id: str, message: dict):
        for websocket in list(self.rooms.get(room_id, {})):
            try:
                await asyncio.wait_for(websocket.send_json(message), timeout=5)
            except (WebSocketDisconnect, RuntimeError, OSError, TimeoutError):
                self.disconnect(websocket, room_id)

    async def remove_user(self, room_id: str, user_id: str):
        for websocket, connected_user in list(self.rooms.get(room_id, {}).items()):
            if connected_user == user_id:
                self.disconnect(websocket, room_id)
                await websocket.close(code=4003)


manager = ConnectionManager()
