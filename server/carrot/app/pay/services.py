from datetime import datetime, timezone
from typing import Annotated
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from carrot.app.pay.exceptions import CoinLackException, ReceiverNotFoundException
from carrot.app.pay.models import Ledger
from carrot.app.pay.repositories import PayRepository
from carrot.app.pay.models import TransactionType
from carrot.app.user.models import User
from carrot.app.user.repositories import UserRepository
from carrot.db.connection import get_db_session


class PayService:
    def __init__(
        self,
        pay_repository: Annotated[PayRepository, Depends()],
        user_repository: Annotated[UserRepository, Depends()],
        session: Annotated[AsyncSession, Depends(get_db_session)],
    ) -> None:
        self.pay_repository = pay_repository
        self.user_repository = user_repository
        self.session = session

    async def deposit(
        self, request_key: str, amount: int, description: str, user: User
    ) -> Ledger:
        async with self.session.begin_nested():
            ledger = await self.pay_repository.get_ledger_by_id(request_key)
            if ledger:
                return ledger

            ledger = Ledger(
                id=request_key,
                transaction_type=TransactionType.DEPOSIT,
                amount=amount,
                description=description,
                time=datetime.now(timezone.utc),
                user_id=user.id,
                receive_user_id=None,
            )
            await self.pay_repository.add_ledger(ledger)

            locked_user = await self.user_repository.get_user_for_update(user.id)
            if not locked_user:
                raise RuntimeError(f"User {user.id} disappeared during transaction.")
            locked_user.coin += amount
            await self.user_repository.update_user(locked_user)
            return ledger

    async def withdraw(
        self, request_key: str, amount: int, description: str, user: User
    ) -> Ledger:
        async with self.session.begin_nested():
            ledger = await self.pay_repository.get_ledger_by_id(request_key)
            if ledger:
                return ledger
            ledger = Ledger(
                id=request_key,
                transaction_type=TransactionType.WITHDRAW,
                amount=amount,
                description=description,
                time=datetime.now(timezone.utc),
                user_id=user.id,
                receive_user_id=None,
            )
            await self.pay_repository.add_ledger(ledger)

            locked_user = await self.user_repository.get_user_for_update(user.id)
            if not locked_user:
                raise RuntimeError(f"User {user.id} disappeared during transaction.")

            if locked_user.coin <= amount:
                raise CoinLackException()
            locked_user.coin -= amount

            await self.user_repository.update_user(locked_user)
            return ledger

    async def _get_2_users_for_update(
        self, user_id1: str, user_id2: str
    ) -> tuple[User | None, User | None]:
        # consistent locking order to prevent deadlock
        # returns the users in the order of arguments given, not in the arguments in which locks were called

        if user_id1 < user_id2:
            user1 = await self.user_repository.get_user_for_update(user_id1)
            user2 = await self.user_repository.get_user_for_update(user_id2)
        else:
            user2 = await self.user_repository.get_user_for_update(user_id2)
            user1 = await self.user_repository.get_user_for_update(user_id1)

        return (user1, user2)

    async def transfer(
        self,
        request_key: str,
        amount: int,
        description: str,
        receive_user_id: str,
        send_user: User,
    ) -> Ledger:
        async with self.session.begin_nested():
            ledger = await self.pay_repository.get_ledger_by_id(request_key)
            if ledger:
                return ledger
            ledger = Ledger(
                id=request_key,
                transaction_type=TransactionType.TRANSFER,
                amount=amount,
                description=description,
                time=datetime.now(timezone.utc),
                user_id=send_user.id,
                receive_user_id=receive_user_id,
            )
            await self.pay_repository.add_ledger(ledger)

            if receive_user_id == send_user.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot transfer to self",
                )

            receive_user_locked, send_user_locked = await self._get_2_users_for_update(
                receive_user_id, send_user.id
            )
            if not send_user_locked:
                raise RuntimeError(
                    f"User {send_user.id} disappeared during transaction."
                )
            if not receive_user_locked:
                raise ReceiverNotFoundException()

            if send_user_locked.coin <= amount:
                raise CoinLackException()
            send_user_locked.coin -= amount

            receive_user_locked.coin += amount

            await self.user_repository.update_user(send_user_locked)
            await self.user_repository.update_user(receive_user_locked)

            return ledger

    async def get_transactions(
        self, user: User, limit: int, offset: int, partner_id: str | None
    ):
        return await self.pay_repository.get_ledgers(user.id, limit, offset, partner_id)
