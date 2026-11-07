from typing import Annotated
from datetime import datetime

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from carrot.db.connection import get_db_session
from carrot.app.auth.models import BlockedToken


class AuthRepository:
    def __init__(
        self, session: Annotated[AsyncSession, Depends(get_db_session)]
    ) -> None:
        self.session = session

    async def block_refresh_token(self, token: str, exp: datetime) -> None:
        blocked_token = BlockedToken(token=token, expired_at=exp)
        self.session.add(blocked_token)
        await self.session.flush()

    async def get_blocked_token(self, token: str) -> BlockedToken | None:
        return await self.session.scalar(
            select(BlockedToken).where(BlockedToken.token == token)
        )
