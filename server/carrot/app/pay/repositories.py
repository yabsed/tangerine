from datetime import datetime
from typing import Annotated
from fastapi import Depends
from sqlalchemy import and_, desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from carrot.app.pay.models import Ledger
from carrot.app.pay.models import TransactionType
from carrot.db.connection import get_db_session


class PayRepository:
    def __init__(
        self, session: Annotated[AsyncSession, Depends(get_db_session)]
    ) -> None:
        self.session = session

    async def add_ledger(self, ledger: Ledger) -> Ledger:
        self.session.add(ledger)
        await self.session.flush()
        await self.session.refresh(ledger, attribute_names=["receive_user"])
        return ledger

    async def get_ledgers(
        self, user_id: str, limit: int, offset: int, partner_id: str | None
    ) -> list[Ledger]:
        if partner_id:
            where_stmt = or_(
                and_(Ledger.user_id == partner_id, Ledger.receive_user_id == user_id),
                and_(Ledger.user_id == user_id, Ledger.receive_user_id == partner_id),
            )
        else:
            where_stmt = or_(
                Ledger.user_id == user_id, Ledger.receive_user_id == user_id
            )

        stmt = (
            select(Ledger)
            .where(where_stmt)
            .order_by(desc(Ledger.time))
            .limit(limit)
            .offset(offset)
            .options(selectinload(Ledger.user), selectinload(Ledger.receive_user))
        )
        ledgers = await self.session.scalars(stmt)
        return list(ledgers.all())

    async def get_ledger_by_id(self, id: str) -> Ledger | None:
        stmt = (
            select(Ledger)
            .where(Ledger.id == id)
            .options(selectinload(Ledger.user), selectinload(Ledger.receive_user))
        )
        return await self.session.scalar(stmt)
