from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from carrot.api import api_router
from carrot.common.exceptions import CarrotException, MissingRequiredFieldException
from carrot.app.auth.settings import AUTH_SETTINGS
from carrot.settings import SETTINGS

app = FastAPI()

# add session middleware (this is used internally by starlette to execute the authorization flow)

if SETTINGS.is_local:
    same_site = "lax"
    https_only = False
else:
    same_site = "none"
    https_only = True

app.add_middleware(
    SessionMiddleware,
    secret_key=AUTH_SETTINGS.SESSION_SECRET,
    max_age=60 * 60,  # one hour, in seconds
    same_site=same_site,
    https_only=https_only,
)

origins = [AUTH_SETTINGS.ALLOW_ORIGIN.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    # allow_origins=["*"],    # 임시로 모든 오리진 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return "Hello, Waffle Project!"


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"REAL ERROR: {exc}")
    for error in exc.errors():
        if error["type"] == "missing":
            raise MissingRequiredFieldException()
    return await request_validation_exception_handler(request, exc)


@app.exception_handler(CarrotException)
async def carrot_exception_handler(request: Request, exc: CarrotException):
    print(f"REAL ERROR: {exc}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error_code": exc.error_code, "error_msg": exc.error_msg},
    )
