from functools import wraps
import re
from typing import Annotated, Callable, TypeVar, List
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr, field_validator
from pydantic.functional_validators import AfterValidator

from carrot.common.exceptions import InvalidFormatException
from carrot.app.region.schemas import RegionResponse
    
class ImageResponse(BaseModel):
    id: str
    image_url: str

    class Config:
        from_attributes = True

