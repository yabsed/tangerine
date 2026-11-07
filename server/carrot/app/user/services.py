from typing import Annotated

from argon2 import PasswordHasher
from fastapi import Depends

from carrot.app.user.models import User, UserStatus
from carrot.app.user.repositories import UserRepository
from carrot.app.user.exceptions import EmailAlreadyExistsException
from carrot.app.user.schemas import UserOnboardingRequest, UserUpdateRequest
from carrot.common.exceptions import InvalidFormatException

# 매번 생성하지 말고 재사용
_password_hasher = PasswordHasher()


class UserService:
    def __init__(self, user_repository: Annotated[UserRepository, Depends()]) -> None:
        self.user_repository = user_repository

    async def create_user(self, email: str, password: str) -> User:
        existing = await self.user_repository.get_user_by_email(email)
        if existing is not None:
            raise EmailAlreadyExistsException()

        hashed_password = _password_hasher.hash(password)

        user = await self.user_repository.create_user(email)
        await self.user_repository.create_local_account(user.id, hashed_password)

        return user

    async def onboard_user(self, request: UserOnboardingRequest, user: User) -> User:
        for key, value in request.model_dump(exclude_none=True).items():
            setattr(user, key, value)

        user.status = UserStatus.ACTIVE

        updated = await self.user_repository.update_user(user)
        return updated

    async def update_user(self, request: UserUpdateRequest, user: User) -> User:
        if not any(
            [request.nickname, request.region_id, request.profile_image]
        ):
            raise InvalidFormatException()

        for key, value in request.model_dump(exclude_none=True).items():
            setattr(user, key, value)

        updated = await self.user_repository.update_user(user)
        return updated

    async def get_user_by_id(self, user_id: str) -> User | None:
        return await self.user_repository.get_user_by_id(user_id)
