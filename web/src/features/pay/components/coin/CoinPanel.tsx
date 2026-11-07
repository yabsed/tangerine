import { useState } from 'react';
import { Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { Button, SegmentedTabBar, StatCard } from '@/shared/ui';
import { useTranslation } from '@/shared/i18n';

type Mode = 'deposit' | 'withdraw';

const PRESET_AMOUNTS = [1000, 5000, 10000, 30000, 50000, 100000];

interface CoinPanelProps {
  currentCoin: number;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
}

export function CoinPanel({ currentCoin, onDeposit, onWithdraw }: CoinPanelProps) {
  const [mode, setMode] = useState<Mode>('deposit');
  const t = useTranslation();

  const handleAction = (amount: number) => {
    if (mode === 'deposit') {
      onDeposit(amount);
    } else {
      onWithdraw(amount);
    }
  };

  return (
    <Stack align="center" py="xl">
      <StatCard
        label={t.pay.ownedCoins}
        value={currentCoin.toLocaleString()}
        unit="C"
        layout="vertical"
        variant="outline"
        withBorder={false}
        bg="transparent"
        radius={0}
        style={{ marginBottom: 30 }}
      />

      <Group justify="center" mb="lg">
        <SegmentedTabBar
          tabs={[
            { id: 'deposit', label: t.pay.charge },
            { id: 'withdraw', label: t.pay.withdraw },
          ]}
          activeTab={mode}
          onTabChange={setMode}
        />
      </Group>

      <Text c="var(--text-secondary)" fw={700} mb="lg">
        {mode === 'deposit' ? t.pay.chargeCoins : t.pay.withdrawCoins}
      </Text>

      <SimpleGrid cols={3} spacing="sm" w="100%">
        {PRESET_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            onClick={() => handleAction(amount)}
            variant={mode === 'deposit' ? 'outline-primary' : 'outline-danger'}
          >
            {mode === 'deposit' ? '+' : '-'}{amount.toLocaleString()}
          </Button>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
