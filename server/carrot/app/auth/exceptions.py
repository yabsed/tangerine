from carrot.common.exceptions import CarrotException


class InvalidAccountException(CarrotException):
    def __init__(self) -> None:
        super().__init__(
            status_code=401,
            error_code="ERR_001",
            error_msg="Invalid account credentials",
        )


class UnauthenticatedException(CarrotException):
    def __init__(self):
        super().__init__(
            status_code=401, error_code="ERR_005", error_msg="UNAUTHENTICATED"
        )


class BadAuthorizationHeaderException(CarrotException):
    def __init__(self):
        super().__init__(
            status_code=400, error_code="ERR_006", error_msg="BAD AUTHORIZATION HEADER"
        )


class InvalidTokenException(CarrotException):
    def __init__(self):
        super().__init__(
            status_code=401, error_code="ERR_007", error_msg="INVALID TOKEN"
        )


class RevokedTokenException(CarrotException):
    def __init__(self) -> None:
        super().__init__(
            status_code=401,
            error_code="ERR_009",
            error_msg="TOKEN REVOKED: LOGGED OUT OR BLOCKED",
        )
