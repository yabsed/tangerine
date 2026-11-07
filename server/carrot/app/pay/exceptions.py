from carrot.common.exceptions import CarrotException
from fastapi import status


class CoinLackException(CarrotException):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="ERR_011",
            error_msg="Not Enough coin to withdraw or transfer.",
        )

class ReceiverNotFoundException(CarrotException):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="ERR_012",
            error_msg="cannot transfer to non-existent user",
        )