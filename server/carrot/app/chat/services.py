from typing import List
from sqlalchemy.orm import joinedload, selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, update, desc, func

from carrot.app.chat.models import ChatRoom, ChatMessage, User, GroupChatRoom, GroupChatMember
from carrot.app.chat.utils import (
    get_unread_count_subquery, 
    get_last_message_id_subquery, 
    parse_chat_room_list_data,
    parse_group_chat_room_list_data
)
from carrot.app.chat.exceptions import (
    ChatRoomNotFoundException, 
    ChatRoomAccessDeniedException,
    ChatRoomFullException,
    NotAllowedException
)

class ChatService:

    async def validate_room_access(self, 
        db: AsyncSession, 
        room_id: str, 
        user_id: str
    ):
        # 1. 1:1 채팅방 및 참여 여부 확인
        room_stmt = select(ChatRoom).where(
            and_(
                ChatRoom.id == room_id,
                or_(ChatRoom.user_one_id == user_id, ChatRoom.user_two_id == user_id)
            )
        )
        
        # 2. 그룹 채팅방 멤버 여부 확인
        group_stmt = select(GroupChatMember).where(
            and_(GroupChatMember.room_id == room_id, GroupChatMember.user_id == user_id)
        )

        # 쿼리 실행
        room_result = await db.execute(room_stmt)
        group_result = await db.execute(group_stmt)

        room = room_result.scalar_one_or_none()
        group_member = group_result.scalar_one_or_none()

        # 두 곳 어디에도 속해있지 않다면 접근 거부
        if not room and not group_member:
            # 방이 아예 없거나, 있는데 내가 멤버가 아닌 경우
            raise ChatRoomAccessDeniedException()

        # 검증 성공 시, 나중에 활용할 수 있도록 찾은 객체를 반환 (필요에 따라)
        return room if room else group_member

    ### 1. 채팅방 생성 및 조회
    async def get_existing_room_or_create(self, 
        db: AsyncSession, 
        user_id: str, 
        opponent_id: str
        ) -> ChatRoom:
        stmt = select(ChatRoom).where(
            or_(
                and_(ChatRoom.user_one_id == user_id, ChatRoom.user_two_id == opponent_id),
                and_(ChatRoom.user_one_id == opponent_id, ChatRoom.user_two_id == user_id)
            )
        )
        result = await db.execute(stmt)
        room = result.scalars().first()

        if not room:
            room = ChatRoom(user_one_id=user_id, user_two_id=opponent_id)
            db.add(room)
            await db.commit()
            await db.refresh(room)
        return room

    ### 2. 내 채팅방 목록 불러오기
    async def get_user_chat_rooms(self, db: AsyncSession, user_id: str):
        unread_sub = get_unread_count_subquery(user_id)
        last_msg_sub = get_last_message_id_subquery()

        stmt = (
            select(
                ChatRoom,
                ChatMessage.content,
                ChatMessage.created_at,
                func.coalesce(unread_sub.c.unread_count, 0)
            )
            .outerjoin(last_msg_sub, ChatRoom.id == last_msg_sub.c.room_id)
            .outerjoin(ChatMessage, ChatMessage.id == last_msg_sub.c.last_msg_id)
            .outerjoin(unread_sub, ChatRoom.id == unread_sub.c.room_id)
            .where(or_(ChatRoom.user_one_id == user_id, ChatRoom.user_two_id == user_id))
            .order_by(desc(ChatMessage.created_at))
        )

        result = await db.execute(stmt)
        return parse_chat_room_list_data(result.all(), user_id)

    ### 3. 메시지 저장 (통합)
    async def save_new_message(self, 
        db: AsyncSession, 
        room_id: str, 
        sender_id: str, 
        content: str
    ) -> ChatMessage:
        # 해당 방(1:1 혹은 그룹)에 유저가 접근 권한이 있는지 먼저 확인
        await self.validate_room_access(db, room_id, sender_id)

        # 1:1 방인지 그룹 방인지 판별하여 필드 할당 (UUID 패턴 등으로 구분하거나 DB 확인)
        # 여기서는 간단하게 두 컬럼 모두 room_id를 넣어보고, DB 구조에 맞게 할당되도록 구성합니다.
        # 실제로는 validate_room_access에서 방의 타입을 반환받아 처리하는 것이 가장 정확합니다.
        
        # 임시 로직: 1:1 방 테이블에 없으면 그룹방으로 간주 (또는 그 반대)
        is_group = await self._check_if_group_room(db, room_id)

        if is_group:
            new_msg = ChatMessage(group_room_id=room_id, sender_id=sender_id, content=content)
        else:
            new_msg = ChatMessage(room_id=room_id, sender_id=sender_id, content=content)
            
        db.add(new_msg)
        await db.commit()
        await db.refresh(new_msg)
        return new_msg

    ### 4. 메시지 조회 (통합)
    async def get_messages_after_id(self, 
        db: AsyncSession, 
        room_id: str, 
        user_id: str, 
        last_id: int, 
        limit: int
    ) -> List[ChatMessage]:
        await self.validate_room_access(db, room_id, user_id)

        # 1:1 room_id 이거나 group_room_id 인 메시지를 모두 조회
        stmt = (
            select(ChatMessage)
            .where(
                and_(
                    or_(ChatMessage.room_id == room_id, ChatMessage.group_room_id == room_id),
                    ChatMessage.id > last_id
                )
            )
            .order_by(ChatMessage.id.asc())
            .limit(limit)
        )
        
        result = await db.execute(stmt)
        return result.scalars().all()

    ### 5. 읽음 처리 (통합)
    async def update_messages_read_status(self, 
        db: AsyncSession, 
        room_id: str, 
        user_id: str
    ):
        # 내가 보낸 게 아니고, 아직 안 읽은 메시지를 찾아 업데이트
        stmt = (
            update(ChatMessage)
            .where(
                and_(
                    or_(ChatMessage.room_id == room_id, ChatMessage.group_room_id == room_id),
                    ChatMessage.sender_id != user_id,
                    ChatMessage.is_read == False
                )
            )
            .values(is_read=True)
        )
        
        await db.execute(stmt)
        await db.commit()

    # 헬퍼 함수: 방 타입 체크
    async def _check_if_group_room(self, db: AsyncSession, room_id: str) -> bool:
        result = await db.execute(select(GroupChatRoom).where(GroupChatRoom.id == room_id))
        return result.scalar_one_or_none() is not None

    ### 6. 상대방 상태 확인
    async def get_chat_partner_status(self, 
        db: AsyncSession, 
        room_id: str, 
        user_id: str
        ):
        room = await self.validate_room_access(db, room_id, user_id)

        # 방 조회
        room_stmt = select(ChatRoom).where(ChatRoom.id == room_id)
        room = (await db.execute(room_stmt)).scalar_one_or_none()
        if not room: return None
        
        opponent_id = room.user_two_id if room.user_one_id == user_id else room.user_one_id
        
        # 상대 유저 조회
        user_stmt = select(User).where(User.id == opponent_id)
        return (await db.execute(user_stmt)).scalar_one_or_none()
    
    ### 7. 오픈 그룹 채팅방 생성 (방장)
    async def create_open_group_room(self, 
        db: AsyncSession, 
        creator_id: str, 
        title: str, 
        description: str = None, 
        max_members: int = 100
        ) -> GroupChatRoom:
        
        # 1. 방 생성
        new_room = GroupChatRoom(
            title=title, 
            description=description, 
            max_members=max_members
        )
        db.add(new_room)
        await db.flush() # ID를 미리 할당받기 위해 flush 사용

        # 2. 생성자를 방장(is_admin=True)으로 멤버 등록
        admin_member = GroupChatMember(
            room_id=new_room.id, 
            user_id=creator_id, 
            is_admin=True
        )
        db.add(admin_member)
        
        await db.commit()
        return await self._get_room_with_members(db, new_room.id)

    ### 8. 채팅방 참여하기 (Join)
    async def join_group_room(self, db: AsyncSession, room_id: str, user_id: str):
        # 1. 방 존재 여부 확인
        stmt = select(GroupChatRoom).where(GroupChatRoom.id == room_id)
        result = await db.execute(stmt)
        room = result.scalar_one_or_none()
        
        if not room:
            raise ChatRoomNotFoundException()

        # 2. 이미 참여 중인지 확인
        member_stmt = select(GroupChatMember).where(
            and_(GroupChatMember.room_id == room_id, GroupChatMember.user_id == user_id)
        )
        existing_member = (await db.execute(member_stmt)).scalar_one_or_none()
        
        # 이미 참여 중이라면, 정보를 새로고침해서 반환 (에러 방지)
        if existing_member:
            return await self._get_room_with_members(db, room_id)

        # 3. 인원 제한 확인
        count_stmt = select(func.count()).select_from(GroupChatMember).where(GroupChatMember.room_id == room_id)
        current_count = (await db.execute(count_stmt)).scalar() or 0
        
        if current_count >= room.max_members:
            raise ChatRoomFullException()

        # 4. 멤버 추가
        new_member = GroupChatMember(room_id=room_id, user_id=user_id, is_admin=False)
        db.add(new_member)
        await db.commit()

        # [핵심] 5. 관계 데이터(members, user)를 포함하여 방 정보 다시 조회
        return await self._get_room_with_members(db, room_id)

    # 재사용을 위한 헬퍼 메서드 추가
    async def _get_room_with_members(self, db: AsyncSession, room_id: str):
        stmt = (
            select(GroupChatRoom)
            .options(
                selectinload(GroupChatRoom.members)  # 멤버 목록 로드
                .selectinload(GroupChatMember.user)  # 멤버의 유저 상세 정보 로드
            )
            .where(GroupChatRoom.id == room_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one()

    ### 9. 참여자 목록 조회 (유저 정보 포함)
    async def get_group_room_members(self, db: AsyncSession, room_id: str) -> List[GroupChatMember]:
        stmt = (
            select(GroupChatMember)
            # joinedload를 사용해 User 모델을 즉시 로딩(Eager Loading)합니다.
            .options(joinedload(GroupChatMember.user)) 
            .where(GroupChatMember.room_id == room_id)
            .order_by(
                desc(GroupChatMember.is_admin), 
                GroupChatMember.joined_at.asc()
            )
        )
        
        result = await db.execute(stmt)
        return result.scalars().all()

    ### 10. 채팅방 나가기 (방장 위임 로직 포함)
    async def leave_group_room(self, db: AsyncSession, room_id: str, user_id: str):
        # 1. 해당 유저가 이 방의 멤버인지 확인
        stmt = select(GroupChatMember).where(
            and_(GroupChatMember.room_id == room_id, GroupChatMember.user_id == user_id)
        )
        member = (await db.execute(stmt)).scalar_one_or_none()
        
        if not member:
            return # 참여 중인 멤버가 아니면 아무 작업 안 함

        is_admin = member.is_admin

        # 2. 방장인지 확인
        if is_admin:
            # 방장이 나가면 방 자체를 삭제 (Cascade 설정에 의해 멤버, 메시지도 함께 삭제됨)
            room_stmt = select(GroupChatRoom).where(GroupChatRoom.id == room_id)
            room = (await db.execute(room_stmt)).scalar_one_or_none()
            if room:
                await db.delete(room)
        else:
            # 일반 유저면 본인만 멤버 테이블에서 삭제
            await db.delete(member)

        await db.commit()

    ### 11. 참여자 강제 퇴장 (방장 전용)
    async def kick_group_member(self, 
        db: AsyncSession, 
        room_id: str, 
        target_user_id: str, 
        admin_user_id: str
    ):
        # 1. 요청자(admin_user_id)가 해당 방의 방장인지 확인
        admin_stmt = select(GroupChatMember).where(
            and_(
                GroupChatMember.room_id == room_id,
                GroupChatMember.user_id == admin_user_id,
                GroupChatMember.is_admin == True
            )
        )
        admin_result = await db.execute(admin_stmt)
        admin_check = admin_result.scalar_one_or_none()

        if not admin_check:
            raise NotAllowedException()

        # 2. 강퇴 대상(target_user_id)이 방에 있는지 확인
        target_stmt = select(GroupChatMember).where(
            and_(
                GroupChatMember.room_id == room_id,
                GroupChatMember.user_id == target_user_id
            )
        )
        target_result = await db.execute(target_stmt)
        target_member = target_result.scalar_one_or_none()

        if not target_member:
            return

        # 3. 방장 자신을 강퇴하려는 경우 방지 (나가기 기능을 써야 함)
        if target_user_id == admin_user_id:
            raise NotAllowedException()

        # 4. 퇴장 처리
        await db.delete(target_member)
        await db.commit()

    ### 12. 내 그룹 채팅방 목록 불러오기
    async def get_user_group_chat_rooms(self, db: AsyncSession, user_id: str):
        # 1. 안 읽은 메시지 수 및 마지막 메시지 ID 서브쿼리 (그룹용 필드 기준)
        # ※ 주의: 유틸리티 함수 내에서 group_room_id를 참조하도록 로직이 짜여 있어야 합니다.
        unread_sub = get_unread_count_subquery(user_id)
        last_msg_sub = get_last_message_id_subquery()

        # 2. 메인 쿼리
        stmt = (
            select(
                GroupChatRoom,
                ChatMessage.content,
                ChatMessage.created_at,
                func.coalesce(unread_sub.c.unread_count, 0)
            )
            # 내가 참여 중인 방만 필터링하기 위해 Member 테이블 조인
            .join(GroupChatMember, GroupChatRoom.id == GroupChatMember.room_id)
            # 마지막 메시지 정보 조인
            .outerjoin(last_msg_sub, GroupChatRoom.id == last_msg_sub.c.room_id)
            .outerjoin(ChatMessage, ChatMessage.id == last_msg_sub.c.last_msg_id)
            # 안 읽은 메시지 수 조인
            .outerjoin(unread_sub, GroupChatRoom.id == unread_sub.c.room_id)
            # 필터링: 내가 멤버인 방만
            .where(GroupChatMember.user_id == user_id)
            # 최신 메시지 순 정렬
            .order_by(desc(ChatMessage.created_at))
        )

        result = await db.execute(stmt)
        
        # 3. 데이터 파싱
        return parse_group_chat_room_list_data(result.all())

chat_service = ChatService()