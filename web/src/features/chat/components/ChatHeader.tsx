import { useNavigate } from 'react-router-dom';
import { ActionIcon, Avatar, Button, Group, Text, UnstyledButton } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from '@/shared/i18n';
import { useHierarchicalBack } from '@/shared/hooks/useHierarchicalBack';

interface ChatHeaderProps {
  opponentId?: string;
  opponentNickname?: string | null;
  opponentProfileImage?: string | null;
  userCoin: number;
  onToggleTransferMenu: () => void;
}

function ChatHeader({
  opponentId,
  opponentNickname,
  opponentProfileImage,
  userCoin,
  onToggleTransferMenu,
}: ChatHeaderProps) {
  const navigate = useNavigate();
  const t = useTranslation();
  const goBack = useHierarchicalBack();

  return (
    <Group
      gap="md"
      px="md"
      py="sm"
      bg="body"
      style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
    >
      <ActionIcon
        variant="subtle"
        color="gray"
        onClick={goBack}
        hiddenFrom="md"
        ml={-4}
      >
        <IconArrowLeft size={20} />
      </ActionIcon>

      <UnstyledButton
        onClick={() => opponentId && navigate(`/user/${opponentId}`)}
        style={{ flex: 1 }}
      >
        <Group gap="sm">
          <Avatar
            src={opponentProfileImage}
            alt={opponentNickname || t.chat.otherParty}
            radius="xl"
          />
          <Text fw={600} size="sm">
            {opponentNickname || t.common.unknown}
          </Text>
        </Group>
      </UnstyledButton>

      <Button
        variant="light"
        color="orange"
        size="xs"
        radius="xl"
        onClick={onToggleTransferMenu}
      >
        {userCoin.toLocaleString()} C
      </Button>
    </Group>
  );
}

export default ChatHeader;
