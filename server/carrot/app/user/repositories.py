from typing import Annotated
from unittest import result

from fastapi import Depends
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from carrot.app.user.models import LocalAccount, SocialAccount, User
from carrot.db.connection import get_db_session


class UserRepository:
    def __init__(
        self, session: Annotated[AsyncSession, Depends(get_db_session)]
    ) -> None:
        self.session = session

    async def create_user(self, email: str) -> User:
        user = User(email=email)
        self.session.add(user)
        await self.session.flush()
        return user

    async def update_user(self, user: User) -> User:
        merged = await self.session.merge(user)
        await self.session.flush()
        return merged

    async def get_user_by_id(self, user_id: str) -> User | None:
        stmt = (
            select(User)
            .options(
                selectinload(User.region),  # 유저의 동네 정보 (Region 모델)
                selectinload(User.local_account),  # 유저의 로컬 계정 정보 (비밀번호 등)
                selectinload(User.social_account),  # 유저의 소셜 계정 정보 (구글 등)
            )
            .where(User.id == user_id)
        )
        return await self.session.scalar(stmt)

    async def get_user_for_update(self, user_id: str):
        stmt = (
            select(User)
            .options(
                selectinload(User.region),  # 유저의 동네 정보 (Region 모델)
                selectinload(User.local_account),  # 유저의 로컬 계정 정보 (비밀번호 등)
                selectinload(User.social_account),  # 유저의 소셜 계정 정보 (구글 등)
            )
            .where(User.id == user_id)
            .with_for_update()
        )
        return await self.session.scalar(stmt)

    async def get_user_by_email(self, email: str) -> User | None:
        return await self.session.scalar(
            select(User)
            .options(selectinload(User.local_account))
            .where(User.email == email)
        )

    async def get_user_by_nickname(self, nickname: str) -> User | None:
        return await self.session.scalar(select(User).where(User.nickname == nickname))

    async def get_social_account_by_provider(
        self, provider: str, sub: str
    ) -> SocialAccount | None:
        stmt = (
            select(SocialAccount)
            .options(selectinload(SocialAccount.user))
            .where(
                and_(
                    SocialAccount.provider == provider,
                    SocialAccount.provider_sub == sub,
                )
            )
        )
        return await self.session.scalar(stmt)

    async def create_social_account(
        self, user_id: str, provider: str, provider_sub: str
    ) -> SocialAccount:
        social_account = SocialAccount(
            user_id=user_id, provider=provider, provider_sub=provider_sub
        )
        self.session.add(social_account)
        await self.session.flush()
        return social_account

    async def get_local_account_by_id(self, user_id: str) -> LocalAccount | None:
        return await self.session.scalar(
            select(LocalAccount).where(LocalAccount.user_id == user_id)
        )

    async def create_local_account(
        self, user_id: str, hashed_password: str
    ) -> LocalAccount:
        local_account = LocalAccount(user_id=user_id, hashed_password=hashed_password)
        self.session.add(local_account)
        await self.session.flush()
        return local_account
