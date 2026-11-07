import React, { useState } from 'react';
import { Box, Group, TextInput, ActionIcon } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import { useTranslation } from '@/shared/i18n';

interface ChatInputProps {
  onSend: (message: string) => void;
  isPending: boolean;
}

function ChatInput({ onSend, isPending }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const t = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isPending) return;
    onSend(message.trim());
    setMessage('');
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      px="md"
      py="sm"
      bg="body"
      style={{
        borderTop: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Group gap="sm" wrap="nowrap">
        <TextInput
          flex={1}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.chat.enterMessage}
          size="md"
          radius="xl"
        />
        <ActionIcon
          type="submit"
          disabled={!message.trim() || isPending}
          size={42}
          radius="xl"
          variant="filled"
          color="blue"
          loading={isPending}
        >
          <IconSend size={20} />
        </ActionIcon>
      </Group>
    </Box>
  );
}

export default ChatInput;
