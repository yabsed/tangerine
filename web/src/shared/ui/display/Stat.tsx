import { type CSSProperties, ReactNode } from 'react';
import { Group, Paper, type PaperProps, Stack, Text } from '@mantine/core';

interface StatProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  className?: string;
}

export function Stat({ icon, label, value, className = '' }: StatProps) {
  return (
    <Group gap={6} className={className} wrap="nowrap">
      {icon}
      {label && (
        <Text component="span" size="xs" c="dimmed" style={{ position: 'absolute', left: -10000, top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
          {label}
        </Text>
      )}
      <Text component="span" size="xs" c="dimmed">
        {value}
      </Text>
    </Group>
  );
}

interface StatGroupProps {
  children: ReactNode;
  className?: string;
}

export function StatGroup({ children, className = '' }: StatGroupProps) {
  return (
    <Group gap="sm" align="center" className={className}>
      {children}
    </Group>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
  style?: CSSProperties;
  bg?: PaperProps['bg'];
  withBorder?: boolean;
  p?: PaperProps['p'];
  layout?: 'vertical' | 'horizontal';
  variant?: 'outline' | 'primary' | 'secondary'; // Button의 variant 시스템 반영
  radius?: PaperProps['radius'];
}

export function StatCard({ 
  label, 
  value, 
  unit, 
  className = '', 
  style,
  bg,
  withBorder,
  p,
  layout = 'vertical',
  variant = 'outline',
  radius = 'md',
}: StatCardProps) {
  const isVertical = layout === 'vertical';
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const computedBg = isPrimary ? 'orange' : isSecondary ? 'var(--mantine-color-gray-0)' : 'transparent';
  const c = isPrimary ? 'white' : undefined;

  const valueColor = isPrimary ? 'white' : 'orange';

  return (
    <Paper
      withBorder={withBorder ?? variant === 'outline'}
      radius={radius}
      p={p ?? (isVertical ? 'xl' : 'md')}
      className={className}
      style={style}
      bg={(bg ?? computedBg) as any}
      c={c}
    >
      {isVertical ? (
        <Stack align="center" gap={6}>
          <Text fw={600} c={isPrimary ? 'rgba(255,255,255,0.85)' : 'dimmed'}>
            {label}:
          </Text>
          <Group gap={6} align="baseline">
            <Text fw={800} fz={48} c={valueColor as any}>
              {value}
            </Text>
            {unit && (
              <Text c={isPrimary ? 'rgba(255,255,255,0.75)' : 'dimmed'} fz={20}>
                {unit}
              </Text>
            )}
          </Group>
        </Stack>
      ) : (
        <Group gap="sm" align="center">
          <Text fw={600} c={isPrimary ? 'rgba(255,255,255,0.85)' : 'dimmed'}>
            {label}:
          </Text>
          <Group gap={6} align="baseline">
            <Text fw={800} fz={18} c={valueColor as any}>
              {value}
            </Text>
            {unit && (
              <Text c={isPrimary ? 'rgba(255,255,255,0.75)' : 'dimmed'} fz="sm">
                {unit}
              </Text>
            )}
          </Group>
        </Group>
      )}
    </Paper>
  );
}