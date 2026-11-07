from carrot.common.exceptions import CarrotException


class NotYourProductException(CarrotException):
    def __init__(self) -> None:
        super().__init__(
            status_code=403,
            error_code="ERR_001",
            error_msg="Not Your Product"
        )
        
class InvalidProductIDException(CarrotException):
    def __init__(self) -> None:
        super().__init__(
            status_code=404,
            error_code="ERR_002",
            error_msg="Invalid Product ID"
        )
        
class ShouldLoginException(CarrotException):
    def __init__(self) -> None:
        super().__init__(
            status_code=403,
            error_code="ERR_003",
            error_msg="Should Login"
        )