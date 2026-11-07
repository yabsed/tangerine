import client from '@/shared/api/client';
import type {
  ChatRoomRead,
  ChatRoomListRead,
  MessageRead,
  OpponentStatus,
} from '@/shared/api/types';

// Re-export types with aliases for backward compatibility
export type ChatRoom = ChatRoomListRead;
export type Message = MessageRead;
export type CreateRoomResponse = ChatRoomRead;

// 채팅방 생성 또는 기존 채팅방 조회
export async function createOrGetRoom(opponent_id: string): Promise<string> {
  const response = await client.post<ChatRoomRead>(
    `/api/chat/rooms?opponent_id=${opponent_id}`
  );
  return response.data.id;
}

// 채팅방 목록 조회
export async function fetchChatRooms(): Promise<ChatRoomListRead[]> {
  const response = await client.get<ChatRoomListRead[]>('/api/chat/rooms');
  return response.data;
}

// 메시지 목록 조회
export async function fetchMessages(room_id: string): Promise<MessageRead[]> {
  const response = await client.get<MessageRead[]>(
    `/api/chat/rooms/${room_id}/messages`
  );
  return response.data;
}

// 메시지 전송
export async function sendMessage(room_id: string, content: string): Promise<MessageRead> {
  const response = await client.post<MessageRead>(
    `/api/chat/rooms/${room_id}/messages`,
    { content }
  );
  return response.data;
}

// 메시지 읽음 처리
export async function markMessagesAsRead(room_id: string): Promise<void> {
  await client.patch(`/api/chat/rooms/${room_id}/messages/read`);
}

// 상대방 상태 조회
export async function fetchOpponentStatus(room_id: string): Promise<OpponentStatus> {
  const response = await client.get<OpponentStatus>(
    `/api/chat/rooms/${room_id}/status`
  );
  return response.data;
}
