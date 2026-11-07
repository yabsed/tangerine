import asyncio

from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    def __init__(self):
        self.connections: dict[WebSocket, tuple[str, str | None]] = {}

    async def connect(self, websocket: WebSocket, room_id: str | None, user_id: str):
        self.connections[websocket] = (user_id, room_id)

    def disconnect(self, websocket: WebSocket):
        self.connections.pop(websocket, None)

    async def broadcast_to_room(self, room_id: str, message: dict, user_ids: set[str]):
        for websocket, (user_id, connected_room) in list(self.connections.items()):
            if connected_room == room_id:
                await self._send(websocket, message)
            elif connected_room is None and user_id in user_ids:
                await self._send(websocket, {"type": "message", "room_id": room_id})

    async def notify_users(self, user_ids: set[str], event: dict):
        for websocket, (user_id, _) in list(self.connections.items()):
            if user_id in user_ids:
                await self._send(websocket, event)

    async def _send(self, websocket: WebSocket, message: dict):
        try:
            await asyncio.wait_for(websocket.send_json(message), timeout=5)
        except (WebSocketDisconnect, RuntimeError, OSError, TimeoutError):
            self.disconnect(websocket)

    async def remove_user(self, room_id: str, user_id: str):
        for websocket, (connected_user, connected_room) in list(self.connections.items()):
            if connected_user == user_id and connected_room == room_id:
                self.disconnect(websocket)
                await websocket.close(code=4003)


manager = ConnectionManager()
