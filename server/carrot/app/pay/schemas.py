from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from carrot.app.pay.models import Ledger, TransactionType
from carrot.app.user.schemas import PublicUserResponse, UserResponse


class BalanceRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    amount: int = Field(gt=0)
    description: str
    request_key: str


class TransferRequest(BalanceRequest):
    receive_user_id: str


class BalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    amount: int
    description: str
    time: datetime
    user: PublicUserResponse


class TransferResponse(BalanceResponse):
    model_config = ConfigDict(from_attributes=True)

    receive_user: PublicUserResponse


class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: TransactionType
    details: TransferResponse | BalanceResponse


def create_transaction_response(ledger: Ledger) -> TransactionResponse:
    if ledger.transaction_type == TransactionType.TRANSFER:
        details = TransferResponse.model_validate(ledger)
    else:
        details = BalanceResponse.model_validate(ledger)

    return TransactionResponse(
        id=ledger.id, type=ledger.transaction_type, details=details
    )
