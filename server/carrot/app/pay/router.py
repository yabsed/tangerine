from typing import Annotated
from fastapi import APIRouter, Depends, Query, status

from carrot.app.auth.utils import login_with_header
from carrot.app.chat.manager import manager
from carrot.app.pay.schemas import (
    BalanceRequest,
    TransactionResponse,
    TransferRequest,
    create_transaction_response,
)
from carrot.app.pay.services import PayService
from carrot.app.user.models import User

pay_router = APIRouter()


@pay_router.post("/deposit", status_code=status.HTTP_201_CREATED)
async def deposit(
    user: Annotated[User, Depends(login_with_header)],
    request: BalanceRequest,
    pay_service: Annotated[PayService, Depends()],
) -> TransactionResponse:
    ledger = await pay_service.deposit(user=user, **request.model_dump())
    return create_transaction_response(ledger)


@pay_router.post("/withdraw", status_code=status.HTTP_201_CREATED)
async def withdraw(
    user: Annotated[User, Depends(login_with_header)],
    request: BalanceRequest,
    pay_service: Annotated[PayService, Depends()],
) -> TransactionResponse:
    ledger = await pay_service.withdraw(user=user, **request.model_dump())
    return create_transaction_response(ledger)


@pay_router.post("/transfer", status_code=status.HTTP_201_CREATED)
async def transfer(
    user: Annotated[User, Depends(login_with_header)],
    request: TransferRequest,
    pay_service: Annotated[PayService, Depends()],
) -> TransactionResponse:
    ledger = await pay_service.transfer(send_user=user, **request.model_dump())
    response = create_transaction_response(ledger)

    # Receivers can read the new balance as soon as the event arrives.
    await pay_service.session.commit()
    await manager.notify_users(
        {ledger.user_id, ledger.receive_user_id},
        {"type": "transfer"},
    )

    return response


@pay_router.get("/", status_code=status.HTTP_200_OK)
async def get_transactions(
    user: Annotated[User, Depends(login_with_header)],
    pay_service: Annotated[PayService, Depends()],
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    partner_id: str | None = Query(default=None),
) -> list[TransactionResponse]:
    ledgers = await pay_service.get_transactions(
        user=user, limit=limit, offset=offset, partner_id=partner_id
    )
    return [create_transaction_response(ledger) for ledger in ledgers]
