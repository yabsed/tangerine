import { PayTransaction } from '@/features/pay/api/payApi';
import { Avatar } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';
import { useLanguage } from '@/shared/store/languageStore';
import { Box, Group, Stack, Text } from '@mantine/core';

interface TransactionItemProps {
  tx: PayTransaction;
  currentUserId?: string;
}

export function TransactionItem({ tx, currentUserId }: TransactionItemProps) {
  const t = useTranslation();
  const { language } = useLanguage();

  const isTransfer = tx.type === 'TRANSFER';
  const isSender = isTransfer && tx.details.user.id === currentUserId;

  const info = tx.type === 'DEPOSIT'
    ? { label: t.pay.charge, icon: '↓', isPositive: true }
    : tx.type === 'WITHDRAW'
      ? { label: t.pay.withdraw, icon: '↑', isPositive: false }
      : isSender
        ? { label: '보냄', icon: '→', isPositive: false }
        : { label: t.pay.received, icon: '←', isPositive: true };

  const sign = info.isPositive ? '+' : '-';
  const formattedDate = new Date(tx.details.time).toLocaleString(language === 'ko' ? 'ko-KR' : 'en-US');

  const otherParty = isTransfer && 'receive_user' in tx.details
    ? (isSender ? tx.details.receive_user : tx.details.user)
    : null;

  // Determine colors based on transaction type
  let mainColor = 'var(--text-primary)';
  let bgColor = 'var(--bg-box)';
  
  // Logic: Money IN = Blue, Money OUT = Red (Pink-ish)
  const isIncoming = tx.type === 'DEPOSIT' || (isTransfer && !isSender);
  
  if (isIncoming) {
      // Deposit or Received: Blue
      mainColor = 'var(--status-info)';
      bgColor = 'rgba(59, 130, 246, 0.1)'; 
  } else {
      // Withdraw or Sent: Red (Pink-ish pastel for background to look softer)
      mainColor = 'var(--status-error)';
      // Using a slightly more pink hue for the background transparency
      // rgb(255, 87, 87) is soft red, 0.1 opacity makes it pastel pink on white
      bgColor = 'rgba(255, 87, 87, 0.1)';
  }

  // Amount color follows the main color
  const amountColor = mainColor;

  return (
    <Box
      p="md"
      className="transition-colors duration-200"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        backgroundColor: bgColor,
      }}
    >
      <Group gap="sm" wrap="nowrap">
        {isTransfer ? (
          <Avatar src={otherParty?.profile_image ?? undefined} alt={otherParty?.nickname || t.common.unknown} size="sm" />
        ) : (
          <Text fw={700} style={{ width: 28, textAlign: 'center', opacity: 0.7, color: mainColor }}>
            {info.icon}
          </Text>
        )}
        <Stack gap={2} style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            {info.label}{isTransfer && otherParty && ` · ${otherParty.nickname || t.common.unknown}`}
          </Text>
          <Text size="xs" c="dimmed">{formattedDate}</Text>
        </Stack>
        <Text fw={700} fz="lg" style={{ color: amountColor }}>
          {sign}{tx.details.amount.toLocaleString()}C
        </Text>
      </Group>
    </Box>
  );
}
