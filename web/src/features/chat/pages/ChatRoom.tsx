import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages, useSendMessage, useMarkAsRead, useChatRoom } from '@/features/chat/hooks/useChat';
import { useUser, useUserProfile } from '@/features/user/hooks/useUser';
import { Loading, ErrorMessage, DetailHeader } from '@/shared/ui';
import { TransferMenu } from '@/features/pay/components/transfer';
import { useTransactions } from '@/features/pay/hooks/useTransactions';
import ChatHeader from '@/features/chat/components/ChatHeader';
import MessageList from '@/features/chat/components/MessageList';
import ChatInput from '@/features/chat/components/ChatInput';
import { POLLING_CONFIG, getPollingInterval } from '@/shared/config/polling';
import { useTranslation } from '@/shared/i18n';
import { Box, Container, Paper, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useVisualViewportHeight } from '@/shared/hooks/useVisualViewportHeight';

function ChatRoom() {
  const t = useTranslation();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const viewportHeight = useVisualViewportHeight();
  const isMdUp = useMediaQuery('(min-width: 768px)');
  const [showTransferMenu, setShowTransferMenu] = useState(false);
  
  const heightStyle = typeof viewportHeight === 'number' 
    ? `calc(${viewportHeight}px - 60px)` 
    : `calc(${viewportHeight} - 60px)`;
  const { user, isLoggedIn, isLoading: userLoading } = useUser({
    refetchInterval: getPollingInterval(POLLING_CONFIG.CHAT_ROOM_PAGE),
  });

  const { room: roomInfo } = useChatRoom(chatId);
  const { messages, isLoading: loading, error } = useMessages(chatId, { refetchInterval: POLLING_CONFIG.CHAT_ROOM_PAGE });
  const sendMessageMutation = useSendMessage(chatId || '');
  const markAsReadMutation = useMarkAsRead(chatId || '');

  const { profile: opponentProfile } = useUserProfile(roomInfo?.opponent_id);
  const { transactions } = useTransactions({
    partnerId: roomInfo?.opponent_id,
    refetchInterval: POLLING_CONFIG.CHAT_ROOM_PAGE,
  });

  useEffect(() => {
    if (!userLoading && !isLoggedIn) {
      navigate('/auth/login');
    }
  }, [userLoading, isLoggedIn, navigate]);

  useEffect(() => {
    if (chatId && isLoggedIn && messages.length > 0) {
      markAsReadMutation.mutate();
    }
  }, [chatId, isLoggedIn, messages.length]);

  const handleSend = (content: string) => {
    if (!chatId || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate(content, {
      onError: () => alert(t.chat.sendFailed),
    });
  };

  if (userLoading || loading) return <Loading />;
  if (error) return <ErrorMessage message={t.chat.messageFailed} />;

  return (
    <Container size="md" py={{ base: 0, md: 'md' }} h={{ base: heightStyle, md: 'auto' }} p={{ base: 0, md: 'md' }}>
      <Box visibleFrom="md" mb="md">
        <DetailHeader />
      </Box>

      <Paper
        withBorder={isMdUp}
        radius={isMdUp ? 'md' : 0}
        style={{ overflow: 'hidden' }}
        h={{ base: '100%', md: '75vh' }}
      >
        <Stack gap={0} h="100%">
          <ChatHeader
            opponentId={roomInfo?.opponent_id}
            opponentNickname={opponentProfile?.nickname}
            opponentProfileImage={opponentProfile?.profile_image}
            userCoin={user?.coin || 0}
            onToggleTransferMenu={() => setShowTransferMenu(!showTransferMenu)}
          />

          {showTransferMenu && (
            <TransferMenu
              currentCoin={user?.coin || 0}
              recipientId={roomInfo?.opponent_id}
              recipientName={opponentProfile?.nickname || t.chat.otherParty}
            />
          )}

          <MessageList messages={messages} transactions={transactions} currentUserId={user?.id} />
          <ChatInput onSend={handleSend} isPending={sendMessageMutation.isPending} />
        </Stack>
      </Paper>
    </Container>
  );
}

export default ChatRoom;
