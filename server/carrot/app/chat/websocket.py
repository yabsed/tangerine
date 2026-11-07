import asyncio
import time

from fastapi import WebSocket, WebSocketDisconnect
from pydantic import ValidationError

from carrot.app.auth.settings import AUTH_SETTINGS
from carrot.app.auth.utils import verify_and_decode_token
from carrot.app.chat.manager import manager
from carrot.app.chat.schemas import MessageCreate, MessageRead
from carrot.app.chat.services import chat_service
from carrot.app.user.models import User, UserStatus
from carrot.common.exceptions import CarrotException
from carrot.db.connection import db


async def websocket_endpoint(websocket: WebSocket, room_id: str):
    if websocket.headers.get("origin") != AUTH_SETTINGS.ALLOW_ORIGIN:
        await websocket.close(code=1008)
        return

    await websocket.accept()

    try:
        auth = await asyncio.wait_for(websocket.receive_json(), timeout=5)
        if not isinstance(auth, dict) or not isinstance(auth.get("token"), str):
            await websocket.close(code=4003)
            return

        claims = verify_and_decode_token(auth["token"], AUTH_SETTINGS.ACCESS_TOKEN_SECRET)
        user_id = claims.get("sub")
        remaining = float(claims.get("exp", 0)) - time.time()
        if not user_id or remaining <= 0:
            await websocket.close(code=4003)
            return

        async with db.session_factory() as session:
            user = await session.get(User, user_id)
            if user is None or user.status != UserStatus.ACTIVE:
                await websocket.close(code=4003)
                return
            await chat_service.validate_room_access(session, room_id, user_id)

        await manager.connect(websocket, room_id, user_id)
        await websocket.send_json({"type": "ready"})

        # Idle connections also close when their access token expires.
        async with asyncio.timeout(remaining):
            while True:
                message = MessageCreate.model_validate(await websocket.receive_json())
                async with db.session_factory() as session:
                    saved = await chat_service.save_new_message(
                        session, room_id, user_id, message.content,
                    )
                    payload = MessageRead.model_validate(saved).model_dump(mode="json")
                await manager.broadcast_to_room(room_id, payload)

    except WebSocketDisconnect:
        pass
    except TimeoutError:
        await websocket.close(code=4001)
    except (CarrotException, ValidationError, ValueError, TypeError):
        await websocket.close(code=4003)
    finally:
        manager.disconnect(websocket, room_id)
