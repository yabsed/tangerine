from carrot.common.exceptions import CarrotException

class FileUploadFailedException(CarrotException):
    def __init__(self) -> None:
        super().__init__(
            status_code=500,
            error_code="ERR_001",
            error_msg="File Upload Failed"
        )