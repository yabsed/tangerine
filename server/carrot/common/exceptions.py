import http
import logging

logger = logging.getLogger('uvicorn.error')

class CarrotException(Exception):
    def __init__(
        self,
        status_code: int = 500,
        error_code: str = "ERR_000",
        error_msg: str = "Unexpected error occurred"
    ):
        if not isinstance(status_code, int) or status_code not in http.HTTPStatus.__members__.values():
            logger.critical(f"Invalid status_code {status_code} provided to CarrotException, defaulting to 500")
            self.status_code = 500
        else:
            self.status_code = status_code
            
        if not isinstance(error_code, str):
            logger.critical(f"Invalid error_code {str(error_code)} provided to CarrotException,"
                            " defaulting to 'ERROR_000'")
            self.error_code = "ERR_000"
        else:
            self.error_code = error_code

        if not isinstance(error_msg, str):
            self.error_msg = http.HTTPStatus(self.status_code).description
            logger.critical(f"Invalid error_msg {str(error_msg)} provided to CarrotException,"
                            f" defaulting to '{self.error_msg}'")
        else:
            self.error_msg = error_msg


class MissingRequiredFieldException(CarrotException):
    def __init__(self):
        super().__init__(
            status_code=400,
            error_code="ERR_002",
            error_msg="MISSING REQUIRED FIELDS"
        )

class InvalidFormatException(CarrotException):
    def __init__(self):
        super().__init__(
            status_code=400,
            error_code="ERR_003",
            error_msg="INVALID FIELD FORMAT"
        )