from carrot.common.exceptions import CarrotException
from fastapi import status


class RegionAlreadyExistsException(CarrotException):
    def __init__(self) -> None:
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            error_code="ERR_011",
            error_msg="Region with same name already exists",
        )
