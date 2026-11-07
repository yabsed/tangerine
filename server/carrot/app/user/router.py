from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from carrot.app.auth.utils import login_with_header, partial_login_with_header
from carrot.app.user.models import User
from carrot.app.user.schemas import (
    PublicUserResponse,
    UserOnboardingRequest,
    UserSignupRequest,
    UserUpdateRequest,
    UserResponse,
)
from carrot.app.user.services import UserService

user_router = APIRouter()


@user_router.post("/", status_code=201, response_model=UserResponse)
async def signup(
    signup_request: UserSignupRequest,
    user_service: Annotated[UserService, Depends()],
) -> UserResponse:
    user = await user_service.create_user(
        signup_request.email,
        signup_request.password,
    )
    return UserResponse.model_validate(user)


@user_router.get("/me", status_code=200, response_model=UserResponse)
async def get_me(
    user: Annotated[User, Depends(partial_login_with_header)],
) -> UserResponse:
    return UserResponse.model_validate(user)


@user_router.post("/me/onboard", status_code=200, response_model=UserResponse)
async def onboard_me(
    user: Annotated[User, Depends(partial_login_with_header)],
    request: UserOnboardingRequest,
    user_service: Annotated[UserService, Depends()],
) -> UserResponse:
    updated_user = await user_service.onboard_user(request=request, user=user)
    return UserResponse.model_validate(updated_user)


@user_router.patch("/me", status_code=200, response_model=UserResponse)
async def update_me(
    user: Annotated[User, Depends(login_with_header)],
    request: UserUpdateRequest,
    user_service: Annotated[UserService, Depends()],
) -> UserResponse:
    updated_user = await user_service.update_user(request=request, user=user)
    return UserResponse.model_validate(updated_user)


@user_router.get("/{user_id}", status_code=status.HTTP_200_OK)
async def get_user(
    user_id: str,
    user_service: Annotated[UserService, Depends()],
) -> PublicUserResponse:
    user = await user_service.get_user_by_id(user_id)
    if user == None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No such user."
        )
    return PublicUserResponse.model_validate(user)
