import { useRef, useEffect } from 'react';
import type { Message } from '@/features/chat/api/chatApi';
import type { PayTransaction } from '@/features/pay/api/payApi';
import { useTranslation } from '@/shared/i18n';
import { useLanguage } from '@/shared/store/languageStore';
import { formatMessageTime } from '@/shared/lib/formatting';
import { Box, Center, Group, Paper, ScrollArea, Stack, Text, useComputedColorScheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

export type ChatItem =
  | { type: 'message'; data: Message; timestamp: number }
  | { type: 'transaction'; data: PayTransaction; timestamp: number };

interface MessageListProps {
  messages: Message[];
  transactions?: PayTransaction[];
  currentUserId?: string;
}

function MessageList({ messages, transactions = [], currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = useTranslation();
  const { language } = useLanguage();
  const computedColorScheme = useComputedColorScheme('light');
  const isDark = computedColorScheme === 'dark';
  const isMobile = useMediaQuery('(max-width: 48em)'); // 768px

  // Merge messages and transactions, sorted by time
  const chatItems: ChatItem[] = [
    ...messages.map((msg) => ({
      type: 'message' as const,
      data: msg,
      timestamp: new Date(msg.created_at).getTime(),
    })),
    ...transactions.map((tx) => ({
      type: 'transaction' as const,
      data: tx,
      timestamp: new Date(tx.details.time).getTime(),
    })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [chatItems.length]);

  const getItemSenderId = (item: ChatItem): string | null => {
    if (item.type === 'message') {
      return item.data.sender_id;
    }
    return null; // Transactions are centered, no sender concept for grouping
  };

  const shouldShowTime = (index: number) => {
    if (index === chatItems.length - 1) return true;
    const current = chatItems[index];
    const next = chatItems[index + 1];
    // Always show time if next item is different type or different sender
    if (current.type !== next.type) return true;
    if (current.type === 'transaction') return true;
    return getItemSenderId(current) !== getItemSenderId(next);
  };

  if (chatItems.length === 0) {
    return (
      <ScrollArea style={{ flex: 1 }}>
        <Center py="xl" px="md">
          <Text size="sm" c="dimmed">
            {t.chat.startConversation}
          </Text>
        </Center>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea style={{ flex: 1 }} px="md" py="sm">
      <Stack gap={6}>
        {chatItems.map((item, index) => {
          const showTime = shouldShowTime(index);

          if (item.type === 'transaction') {
            const tx = item.data;
            const isSender = tx.type === 'TRANSFER' && tx.details.user.id === currentUserId;
            const amount = tx.details.amount;

            return (
              <Center key={`tx-${tx.id}`} my={4}>
                <Paper withBorder radius="xl" px="md" py={6} bg={isDark ? 'dark.6' : 'gray.0'}>
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={600} c={isSender ? 'blue' : 'teal'}>
                      {isSender ? '↑' : '↓'} {amount.toLocaleString()}C
                    </Text>
                    <Text size="xs" c="dimmed">
                      {isSender ? t.pay.transfer : t.pay.received}
                    </Text>
                    {showTime && (
                      <Text size="xs" c="dimmed">
                        {formatMessageTime(tx.details.time, language)}
                      </Text>
                    )}
                  </Group>
                </Paper>
              </Center>
            );
          }

          const msg = item.data;
          const isMe = msg.sender_id === currentUserId;

          return (
            <Group
              key={msg.id}
              justify={isMe ? 'flex-end' : 'flex-start'}
              align="flex-end"
              gap={6}
              wrap="nowrap"
            >
              {isMe && showTime && (
                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {formatMessageTime(msg.created_at, language)}
                </Text>
              )}

              <Paper
                radius="lg"
                px="md"
                py="xs"
                withBorder={!isMe}
                bg={isMe ? 'blue.6' : (isDark ? 'dark.6' : 'gray.1')}
                c={isMe ? 'white' : undefined}
                style={{
                  maxWidth: isMobile ? '85%' : '75%',
                  wordBreak: 'break-word',
                  borderBottomRightRadius: isMe ? 0 : undefined,
                  borderBottomLeftRadius: !isMe ? 0 : undefined,
                }}
              >
                <Text size="sm" style={{ lineHeight: 1.4 }}>
                  {msg.content}
                </Text>
              </Paper>

              {!isMe && showTime && (
                <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {formatMessageTime(msg.created_at, language)}
                </Text>
              )}
            </Group>
          );
        })}
        <Box ref={messagesEndRef} />
      </Stack>
    </ScrollArea>
  );
}

export default MessageList;
