from functools import wraps
import re
from typing import Annotated, Callable, TypeVar
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator
from pydantic.functional_validators import AfterValidator

from carrot.common.exceptions import InvalidFormatException
from carrot.app.region.schemas import RegionResponse


def validate_email(v: str) -> str:
    pattern = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    if not isinstance(v, str) or not pattern.match(v):
        raise InvalidFormatException()
    return v


def validate_password(v: str) -> str:
    if len(v) < 8 or len(v) > 20:
        raise InvalidFormatException()
    return v


def validate_nickname(v: str) -> str:
    if len(v) > 20:
        raise InvalidFormatException()
    return v


def validate_coin(v: int) -> int:
    if v < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User cannot own negative amount of coins.",
        )
    return v


T = TypeVar("T")


def skip_none(validator: Callable[[T], T]) -> Callable[[T | None], T | None]:
    @wraps(validator)
    def wrapper(value: T | None) -> T | None:
        if value is None:
            return value
        return validator(value)

    return wrapper


class UserSignupRequest(BaseModel):
    email: Annotated[str, AfterValidator(validate_email)]
    password: Annotated[str, AfterValidator(validate_password)]

    @field_validator("password", mode="after")
    def validate_password(cls, v) -> str:
        if len(v) < 8 or len(v) > 20:
            raise InvalidFormatException()
        return v


class UserOnboardingRequest(BaseModel):
    nickname: Annotated[str, AfterValidator(validate_nickname)]
    region_id: str
    profile_image: str | None = None
    coin: Annotated[int | None, AfterValidator(skip_none(validate_coin))] = None


class UserUpdateRequest(BaseModel):
    nickname: Annotated[str | None, AfterValidator(skip_none(validate_nickname))] = None
    region_id: str | None = None
    profile_image: str | None = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    nickname: str | None
    region: RegionResponse | None
    profile_image: str | None
    coin: int
    status: str

    class Config:
        from_attributes = True


class PublicUserResponse(BaseModel):
    id: str
    nickname: str
    profile_image: str | None

    class Config:
        from_attributes = True
