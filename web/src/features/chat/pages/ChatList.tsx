import ChatRoomItem from '@/features/chat/components/ChatRoomItem';
import { PageContainer } from '@/shared/layouts/PageContainer';
import { Loading, ErrorMessage, EmptyState, LoginRequired, OnboardingRequired } from '@/shared/ui';
import { useChatRooms, ChatRoom } from '@/features/chat/hooks/useChat';
import { useUser } from '@/features/user/hooks/useUser';
import { POLLING_CONFIG, getPollingInterval } from '@/shared/config/polling';
import { useTranslation } from '@/shared/i18n';
import { Stack } from '@mantine/core';

function ChatList() {
  const { isLoggedIn, isLoading: userLoading, needsOnboarding } = useUser();
  const t = useTranslation();

  const canFetch = isLoggedIn && !needsOnboarding;
  const { rooms, isLoading: loading, error } = useChatRooms({
    refetchInterval: getPollingInterval(POLLING_CONFIG.CHAT_ROOMS, canFetch),
    enabled: canFetch,
  });

  if (userLoading) return <Loading />;

  if (!isLoggedIn) {
    return (
      <PageContainer title={t.chat.chat}>
        <LoginRequired message={t.chat.loginToChat} />
      </PageContainer>
    );
  }

  if (needsOnboarding) {
    return (
      <PageContainer title={t.chat.chat}>
        <OnboardingRequired />
      </PageContainer>
    );
  }

  if (loading) return <Loading />;
  if (error) {
    return (
      <PageContainer title={t.chat.chat}>
        <ErrorMessage message={t.chat.loadFailed} />
      </PageContainer>
    );
  }
  if (rooms.length === 0) return (
    <PageContainer title={t.chat.chat}>
      <EmptyState message={t.chat.noHistory} />
    </PageContainer>
  );

  return (
    <PageContainer title={t.chat.chat}>
      <Stack gap="xs">
        {rooms.map((room : ChatRoom) => (
          <ChatRoomItem
            key={room.room_id}
            room={room}
          />
        ))}
      </Stack>
    </PageContainer>
  );
}

export default ChatList;
