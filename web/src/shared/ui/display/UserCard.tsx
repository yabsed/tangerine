import { ReactNode } from 'react';
import { Group, Stack, Text, UnstyledButton } from '@mantine/core';
import Avatar from './Avatar';

interface UserCardProps {
  profileImage?: string;
  nickname: string;
  subtitle: string;
  onNavigate?: () => void;
  action?: ReactNode;
}

export function UserCard({ profileImage, nickname, subtitle, onNavigate, action }: UserCardProps) {
  return (
    <Group justify="space-between" align="center" wrap="nowrap">
      <UnstyledButton onClick={onNavigate} style={{ flex: 1 }}>
        <Group gap="sm" wrap="nowrap">
          <Avatar src={profileImage} alt={nickname} size="sm" />
          <Stack gap={2}>
            <Text fw={600} lineClamp={1}>{nickname}</Text>
            <Text size="sm" c="dimmed">{subtitle}</Text>
          </Stack>
        </Group>
      </UnstyledButton>
      {action}
    </Group>
  );
}
