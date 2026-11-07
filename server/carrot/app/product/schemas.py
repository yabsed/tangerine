from functools import wraps
import re
from typing import Annotated, Callable, TypeVar, List
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator
from pydantic.functional_validators import AfterValidator

from carrot.app.auction.schemas import AuctionCreate, AuctionResponse
from carrot.common.exceptions import InvalidFormatException
from carrot.app.region.schemas import RegionResponse


def validate_title(v: str) -> str:
    if len(v) > 50:
        raise InvalidFormatException()
    return v

def validate_content(v: str) -> str:
    if len(v) > 500:
        raise InvalidFormatException()
    return v

def validate_price(v: int) -> int:
    if v < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Price cannot be negative",
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


class ProductPostRequest(BaseModel):
    title: Annotated[str, AfterValidator(validate_title)]
    image_ids: list
    content: Annotated[str, AfterValidator(validate_content)]
    price: Annotated[int, AfterValidator(validate_price)]
    category_id: str

    auction: AuctionCreate | None = None

class ProductPatchRequest(BaseModel):
    title: Annotated[str, AfterValidator(validate_title)]
    image_ids: list
    content: Annotated[str, AfterValidator(validate_content)]
    price: Annotated[int, AfterValidator(validate_price)]
    category_id: str
    region_id: str
    is_sold: bool


class ProductResponse(BaseModel):
    id: str
    owner_id: str
    title: str
    image_ids: List[str]
    content: str | None
    price: int
    like_count: int
    category_id: str
    region_id: str
    is_sold: bool

    auction: AuctionResponse | None = None

    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    id: str
    owner_id: str
    title: str
    image_ids: List[str]
    content: str | None
    price: int
    like_count: int
    category_id: str
    region_id: str
    is_sold: bool

    class Config:
        from_attributes = True
