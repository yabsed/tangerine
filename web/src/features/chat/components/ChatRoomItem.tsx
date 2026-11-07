import { useNavigate } from 'react-router-dom';
import { Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { Avatar, Badge } from '@/shared/ui';
import { useUserProfile } from '@/features/user/hooks/useUser';
import { ChatRoom } from '@/features/chat/hooks/useChat';
import { useTranslation } from '@/shared/i18n';
import { formatRelativeTime } from '@/shared/lib/formatting';

interface ChatRoomItemProps {
  room: ChatRoom;
}

function ChatRoomItem({ room }: ChatRoomItemProps) {
  const navigate = useNavigate();
  const { profile } = useUserProfile(room.opponent_id);
  const t = useTranslation();

  const displayTime = formatRelativeTime(room.last_message_at, t.chat);

  return (
    <UnstyledButton
      onClick={() => navigate(`/chat/${room.room_id}`)}
      py="sm"
      px="md"
      className="border-b border-border-base hover:bg-bg-box-light transition-colors w-full"
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar
          src={profile?.profile_image || undefined}
          alt={profile?.nickname || t.chat.otherParty}
          size="sm"
        />
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} lineClamp={1}>{profile?.nickname || t.common.unknown}</Text>
          <Text size="sm" c="dimmed" lineClamp={1}>{room.last_message || ''}</Text>
        </Stack>
        <Stack gap={4} align="flex-end" style={{ minWidth: 'fit-content' }}>
          <Text size="xs" c="dimmed">{displayTime}</Text>
          {room.unread_count > 0 && (
            <Badge variant="notification">{room.unread_count > 99 ? '99+' : room.unread_count}</Badge>
          )}
        </Stack>
      </Group>
    </UnstyledButton>
  );
}

export default ChatRoomItem;
