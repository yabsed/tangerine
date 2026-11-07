from carrot.common.exceptions import CarrotException


class EmailAlreadyExistsException(CarrotException):
    def __init__(self) -> None:
        super().__init__(
            status_code=409, error_code="ERR_004", error_msg="EMAIL ALREADY EXISTS"
        )


class OnboardingException(CarrotException):
    def __init__(self) -> None:
        super().__init__(
            status_code=403,
            error_code="ERR_008",
            error_msg="USER PENDING, ONBOARDING NEEDED",
        )
