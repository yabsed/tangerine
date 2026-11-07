import { Text } from '@mantine/core';

interface PriceDisplayProps {
  amount: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  c?: string;
}

const sizeMap = { sm: 16, md: 24, lg: 32 } as const;

export function PriceDisplay({ amount, unit = 'C', size = 'md', c = 'orange' }: PriceDisplayProps) {
  return (
    <Text fw={800} fz={sizeMap[size]} c={c}>
      {amount.toLocaleString()}{unit}
    </Text>
  );
}
