import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchChatRooms,
  fetchMessages,
  createOrGetRoom,
  sendMessage,
  markMessagesAsRead,
  Message,
} from '@/features/chat/api/chatApi';
import { POLLING_CONFIG } from '@/shared/config/polling';

// Re-export types for convenience
export type { ChatRoom, Message } from '@/features/chat/api/chatApi';

export const chatKeys = {
  all: ['chat'] as const,
  rooms: () => [...chatKeys.all, 'rooms'] as const,
  messages: (roomId: string) => [...chatKeys.all, 'messages', roomId] as const,
};

interface UseChatRoomsOptions {
  refetchInterval?: number | false;
  enabled?: boolean;
}

export function useChatRooms(options: UseChatRoomsOptions = {}) {
  const { refetchInterval = false, enabled = true } = options;

  const { data: rooms, isLoading, error, refetch } = useQuery({
    queryKey: chatKeys.rooms(),
    queryFn: fetchChatRooms,
    staleTime: POLLING_CONFIG.STALE_TIME.CHAT_ROOMS,
    refetchInterval: (query) => {
      // 에러가 발생했을 때는 폴링 중단
      if (query.state.error) return false;
      return refetchInterval;
    },
    enabled,
    retry: 2, // 네트워크 오류 등을 위해 2회 재시도
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });

  // Compute total unread count
  const totalUnreadCount = rooms?.reduce((sum, room) => sum + room.unread_count, 0) ?? 0;

  return {
    rooms: rooms ?? [], // 에러 발생 시에도 빈 배열 반환
    isLoading: isLoading && !error, // 에러가 있으면 로딩 상태가 아님
    error,
    refetch,
    totalUnreadCount,
  };
}

// Get a single room from the cached list
export function useChatRoom(roomId: string | undefined) {
  const { rooms, isLoading } = useChatRooms();
  const room = rooms.find(r => r.room_id === roomId) ?? null;
  return { room, isLoading };
}

interface UseMessagesOptions {
  refetchInterval?: number | false;
}

export function useMessages(roomId: string | undefined, options: UseMessagesOptions = {}) {
  const { refetchInterval = false } = options;

  const { data: messages, isLoading, error, refetch } = useQuery({
    queryKey: chatKeys.messages(roomId || ''),
    queryFn: () => fetchMessages(roomId!),
    enabled: !!roomId,
    staleTime: POLLING_CONFIG.STALE_TIME.CHAT_MESSAGES,
    refetchInterval,
  });

  return {
    messages: messages ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (opponentId: string) => createOrGetRoom(opponentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
    },
  });
}

export function useSendMessage(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => sendMessage(roomId, content),
    onSuccess: (newMessage) => {
      // 메시지 목록에 새 메시지 추가 (optimistic update 대신 캐시 직접 업데이트)
      queryClient.setQueryData<Message[]>(
        chatKeys.messages(roomId),
        (old) => (old ? [...old, newMessage] : [newMessage])
      );
      // 채팅방 목록도 갱신 (last_message 업데이트를 위해)
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
    },
  });
}

export function useMarkAsRead(roomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markMessagesAsRead(roomId),
    onSuccess: () => {
      // 채팅방 목록의 unread_count 갱신
      queryClient.invalidateQueries({ queryKey: chatKeys.rooms() });
    },
  });
}
